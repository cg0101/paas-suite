const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const fs = require('fs-extra');
const path = require('path');
let SRC_PATH = '~{yourProject}';
function transformSeajsCodeToWebpackCode(filePath) {
    try {
        const newFilePath = path.join(__dirname, 'src', filePath.replace(SRC_PATH, ''));

        if (filePath.includes('.png') || filePath.includes('.less') || filePath.includes('.html')) {
            let tmp = path.parse(newFilePath);
            fs.ensureDirSync(tmp.dir);
            fs.copyFileSync(filePath, newFilePath);
            return;
        }
        // 源代码
        const code = fs.readFileSync(filePath, 'utf-8');
        // parse 解析源代码生成AST
        const ast = parse(code, {
            /*options*/
        });

        // transform 代码转换
        // 遍历AST节点（深度优先）
        //Step1 去除Define 函数包裹
        traverse(ast, {
            // 通过visitor访问Identifier(标识符)类型的节点
            Identifier(path) {
                // path表示访问到该节点的一条路径，基于path可以进行各种修改操作
                if (path.node.name === 'require') {
                    console.log(path.node.arguments);
                }
            },
            VariableDeclaration(path) {},
            ExpressionStatement(path) {
                //   console.log(path.node.expression);
                if (path.node.expression.callee && path.node.expression.callee.name === 'define') {
                    path.replaceWithMultiple(path.node.expression.arguments[0].body.body);
                }
            },
            FunctionDeclaration(path) {}
        });

        //   // generate AST生成目标代码
        const newCode = generate(
            ast,
            {
                /*options*/
            },
            code
        ).code;

        //Step2 require('flow-html') 修改为 require('flow.html');
        //Step3 调整 xx.css 文件引用;
        //Step4 调整代码中的 modules.exports 这样的语法
        //Step5 去除代码中 require.async 的逻辑

        fs.ensureFileSync(newFilePath);
        fs.writeFileSync(newFilePath, newCode);
    } catch (e) {
        if (e) {
            console.log(filePath);
        }
    }
}

let collectObj = {
    filesList: [],
    dirsList: []
};

function readFileList(dir, collectObj) {
    let { filesList, dirsList } = collectObj;
    const files = fs.readdirSync(dir);
    files.forEach((item, index) => {
        var fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            dirsList.push(fullPath);
            readFileList(path.join(dir, item), collectObj); //递归读取文件
        } else {
            filesList.push(fullPath);
        }
    });
    return collectObj;
}
collectObj = readFileList(SRC_PATH, collectObj);
// fs.rmdirSync(path.join(__dirname, "src"));
fs.ensureDirSync(path.join(__dirname, 'src'));

// collectObj.filesList.forEach((item) => transformSeajsCodeToWebpackCode(item));
transformSeajsCodeToWebpackCode(path.join(SRC_PATH, 'test.js'));
