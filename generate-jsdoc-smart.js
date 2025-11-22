const fs = require("fs");
const path = require("path");

const PROJECT_DIR = path.join(__dirname, ""); // عدّل المسار حسب مشروعك
const EXCLUDED_DIRS = ['node_modules', 'dist', 'build']; // مجلدات مستثناة

// جلب جميع ملفات JS مع استثناء المجلدات غير المرغوبة
function getJsFiles(dir) {
  let results = [];
  
  try {
    const list = fs.readdirSync(dir);
    
    list.forEach((file) => {
      if (EXCLUDED_DIRS.includes(file)) return;
      
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results = results.concat(getJsFiles(filePath));
      } else if (file.endsWith(".js") || file.endsWith(".jsx")) {
        results.push(filePath);
      }
    });
  } catch (error) {
    console.error(`❌ خطأ في قراءة المجلد: ${dir}`, error.message);
  }
  
  return results;
}

// توليد وصف عربي تلقائي محسن
function autoDescription(name, type = "function", context = "") {
  // تحويل camelCase/PascalCase إلى كلمات منفصلة
  name = name.replace(/([A-Z])/g, " $1").replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().trim();
  
  const descriptions = {
    function: `تقوم ${name} بتنفيذ المهمة المطلوبة`,
    constant: `يخزن ${name} قيمة ثابتة للتطبيق`,
    variable: `يستخدم ${name} لتخزين البيانات المؤقتة`,
    class: `تمثل ${name} فئة رئيسية في التطبيق`,
    component: `يمثل ${name} مكون واجهة مستخدم`,
    param: `يمثل ${name} معطى الإدخال`,
    file: `يحتوي ${name} على شيفرة ${context}`
  };
  
  return descriptions[type] || `عنصر ${name}`;
}

// التحقق مما إذا كان العنصر موثقًا مسبقًا
function hasExistingJSDoc(line) {
  return line.trim().startsWith('/**') || 
         line.trim().startsWith('//') || 
         line.includes('@');
}

// إضافة @file أعلى الملف إذا لم يكن موجود
function addFileTag(content, filePath) {
  const fileName = path.basename(filePath);
  const fileExt = path.extname(fileName);
  const baseName = path.basename(fileName, fileExt);
  
  if (!content.includes("@file") && !content.includes("@overview")) {
    const fileDescription = autoDescription(baseName, "file", getFileContext(content));
    return `/**
 * @file ${fileName}
 * @description ${fileDescription}
 * @author نظام التوثيق التلقائي
 * @version 1.0.0
 * @created ${new Date().toLocaleDateString('ar-EG')}
 */
${content}`;
  }
  return content;
}

// تحديد سياق الملف
function getFileContext(content) {
  if (content.includes('React') || content.includes('JSX')) return 'مكونات React';
  if (content.includes('exports') || content.includes('module.exports')) return 'وحدات التطبيق';
  if (content.includes('router') || content.includes('route')) return 'التوجيه والمسارات';
  return 'التطبيق';
}

// إضافة JSDoc للكلاسات
function addJSDocToClasses(content) {
  const classRegex = /^(?!\s*\/\*\*)(\s*class\s+(\w+)(?:\s+extends\s+(\w+))?)/gm;
  
  return content.replace(classRegex, (match, full, className, parentClass) => {
    if (hasExistingJSDoc(match)) return match;
    
    const extendsDoc = parentClass ? ` * @extends {${parentClass}}\n` : '';
    
    return `/**
 * @class ${className}
 * @description ${autoDescription(className, "class")}
${extendsDoc} * @constructor
 */
${match}`;
  });
}

// إضافة JSDoc للأسهم (Arrow Functions)
function addJSDocToArrowFunctions(content) {
  const arrowFunctionRegex = /^(?!\s*\/\*\*)(\s*const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>)/gm;
  
  return content.replace(arrowFunctionRegex, (match, full, funcName, params) => {
    if (hasExistingJSDoc(match)) return match;
    
    const isAsync = match.includes('async');
    const paramList = params
      .split(",")
      .map(p => p.trim())
      .filter(p => p)
      .map(p => {
        const [paramName] = p.split('=').map(s => s.trim());
        return ` * @param {*} ${paramName} - ${autoDescription(paramName, "param")}`;
      })
      .join("\n");
    
    return `/**
 * ${isAsync ? '@async ' : ''}@function ${funcName}
 * @description ${autoDescription(funcName)}
${paramList ? paramList + "\n" : ""} * @returns {*} - نتيجة التنفيذ
 */
${match}`;
  });
}

// إضافة JSDoc للدوال المعدودة (محدث)
function addJSDocToFunctions(content) {
  const patterns = [
    {
      regex: /^(?!\s*\/\*\*)(\s*async\s+function\s+(\w+)\s*\(([^)]*)\)\s*{)/gm,
      type: 'async'
    },
    {
      regex: /^(?!\s*\/\*\*)(\s*function\s+(\w+)\s*\(([^)]*)\)\s*{)/gm,
      type: 'normal'
    }
  ];

  patterns.forEach(({ regex, type }) => {
    content = content.replace(regex, (match, full, funcName, params) => {
      if (hasExistingJSDoc(match)) return match;

      const paramList = params
        .split(",")
        .map(p => p.trim())
        .filter(p => p)
        .map(p => {
          const [paramName] = p.split('=').map(s => s.trim());
          return ` * @param {*} ${paramName} - ${autoDescription(paramName, "param")}`;
        })
        .join("\n");

      const isAsync = type === 'async';
      
      return `/**
 * ${isAsync ? '@async ' : ''}@function ${funcName}
 * @description ${autoDescription(funcName)}
${paramList ? paramList + "\n" : ""} * @returns {${isAsync ? 'Promise<*>' : '*'}} - ناتج العملية
 * @throws {Error} - الأخطاء المحتملة أثناء التنفيذ
 */
${match}`;
    });
  });

  return content;
}

// إضافة JSDoc للثوابت المهمة (محدث)
function addJSDocToConstants(content) {
  const importantConstants = /^(?!\s*\/\*\*)(\s*(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=)/gm;
  
  return content.replace(importantConstants, (match, full, constName) => {
    if (hasExistingJSDoc(match)) return match;
    
    return `/**
 * @constant ${constName}
 * @description ${autoDescription(constName, "constant")}
 */
${match}`;
  });
}

// اكتشاف الكود الميت المحسن
function markDeadCode(content) {
  const deadPatterns = [
    /(?:function|const)\s+(unused|dead|notused|test|demo)(\w*)\s*[=({]/gi,
    /(?:function|const)\s+(\w+)(?:\s*=\s*\([^)]*\)\s*=>\s*\{?\s*(?:console\.log|\/\/))/g
  ];
  
  deadPatterns.forEach(pattern => {
    content = content.replace(pattern, (match, p1, p2) => {
      const fullName = p1 + (p2 || '');
      return `/** @deprecated - هذا العنصر ${fullName} غير مستخدم ويجب مراجعته */\n${match}`;
    });
  });
  
  return content;
}

// اكتشاف التكرار المحسن
function markDuplicateFunctions(content, fileName) {
  const functionNames = new Map();
  const patterns = [
    /(?:function|class)\s+(\w+)/g,
    /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    /(?:let|var)\s+(\w+)\s*=\s*(?:async\s*)?function/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1];
      if (functionNames.has(name)) {
        const count = functionNames.get(name) + 1;
        functionNames.set(name, count);
        
        if (count > 1) {
          const todoComment = `/** @todo - دمج مع الدوال الأخرى بنفس الاسم (تم العثور على ${count}) */\n`;
          content = content.replace(
            new RegExp(`(\\s*)(?:function|class|const|let|var)\\s+${name}(?=\\s*[=({])`),
            `$1${todoComment}$1${match[0]}`
          );
        }
      } else {
        functionNames.set(name, 1);
      }
    }
  });
  
  return content;
}

// إنشاء تقرير عن التغييرات
function generateReport(processedFiles, totalFiles) {
  const report = {
    totalFiles,
    processedFiles: processedFiles.length,
    timestamp: new Date().toLocaleString('ar-EG'),
    files: processedFiles
  };
  
  const reportPath = path.join(__dirname, 'jsdoc-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  return report;
}

// معالجة ملف كامل مع معالجة الأخطاء
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    
    content = addFileTag(content, filePath);
    content = addJSDocToClasses(content);
    content = addJSDocToFunctions(content);
    content = addJSDocToArrowFunctions(content);
    content = addJSDocToConstants(content);
    content = markDeadCode(content);
    content = markDuplicateFunctions(content, filePath);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ تمت معالجة الملف: ${filePath}`);
      return true;
    } else {
      console.log(`⚪ لم يتطلب تغييرات: ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ خطأ في معالجة الملف: ${filePath}`, error.message);
    return false;
  }
}

// التنفيذ الرئيسي
function main() {
  console.log('🚀 بدء عملية التوثيق التلقائي...\n');
  
  const jsFiles = getJsFiles(PROJECT_DIR);
  console.log(`📁 تم العثور على ${jsFiles.length} ملف JS\n`);
  
  const processedFiles = [];
  
  jsFiles.forEach((file, index) => {
    console.log(`⏳ معالجة الملف ${index + 1}/${jsFiles.length}...`);
    if (processFile(file)) {
      processedFiles.push(file);
    }
  });
  
  // إنشاء تقرير
  const report = generateReport(processedFiles, jsFiles.length);
  
  console.log('\n🎉 تم الانتهاء من عملية التوثيق!');
  console.log(`📊 تم معالجة ${processedFiles.length} من أصل ${jsFiles.length} ملف`);
  console.log(`📄 تم حفظ التقرير في: jsdoc-report.json`);
}

// التنفيذ
if (require.main === module) {
  main();
}

module.exports = {
  getJsFiles,
  processFile,
  autoDescription,
  addJSDocToFunctions,
  addJSDocToConstants
};