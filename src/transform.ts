import * as ts from 'typescript'
import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'

/**
 * Options
 *
 * @export
 * @interface Opts
 */
export interface Opts {
    /**
     * Extensions that will be imported as text.
     */
    extensions?: string[]
}

function extensionMatches(filePath: string, extensions: string[]) {
    return extensions.some(ext => filePath.endsWith(ext));
}

function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile, opts: Opts) {
    const { extensions = [] } = opts
    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
        if(ts.isImportDeclaration(node) && node.importClause?.namedBindings) {
            const namedBindings = node.importClause.namedBindings
            if(!ts.isNamespaceImport(namedBindings)) {
                return ts.visitEachChild(node, visitor, ctx)
            }

            let moduleName = (node.moduleSpecifier as ts.StringLiteral).text;
            if(!extensionMatches(moduleName, extensions)) {
                return ts.visitEachChild(node, visitor, ctx)
            }

            if (moduleName.startsWith('.')) {
                const sourcePath = sf.fileName
                moduleName = resolve(dirname(sourcePath), moduleName)
            }

            const contentStr = readFileSync(moduleName, { encoding: 'utf-8' })

            return ts.createVariableStatement(
                undefined,
                ts.createVariableDeclarationList(
                    ts.createNodeArray([ts.createVariableDeclaration(namedBindings.name, undefined, ts.createLiteral(contentStr))])
                )
            )

        } else {
            return ts.visitEachChild(node, visitor, ctx)
        }
    }

    return visitor
}

export function transform(program: ts.Program, opts: Opts = {}) {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf, opts))
    }
}
