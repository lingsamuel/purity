// FuHsi.js

// 仅含空白字符
function onlySpace(str) {
  return str == undefined || /^[ \r\n\t]+$/.test(str);
}

// 英文合法字符串
function canBeEn(str) {
  // 仅判断：数字字母、逗号、空格、斜杠、ASCII 引号，Unicode 引号，英文圆括号，英文句号，英文叹号，英文问号，英文 dash，换行，冒号
  return str != undefined && /^[0-9a-zA-Z, //\\\'\"‘’“”\(\)\.\!\?\-\r\n\:]+$/.test(str);
}

function onlyNeutralCharacter(str) {
  // 仅判断中立符号：
  // 数字、空格、斜杠、Unicode 引号，换行
  return str != undefined && /^[0-9 //\\‘’“”\r\n]+$/.test(str);
}

function hasQuote(str) {
  return str != undefined && /[‘’“”]/g.test(str);
}

function hasEnLetter(str) {
  return str != undefined && /[a-zA-Z]/g.test(str);
}

function isQuote(char) {
  return (['\'', '\"', '‘', '’', '“', '”']).includes(char);
}

function isEnOnlyQuote(char) {
  return (['\'', '\"']).includes(char);
}

function isOpenQuote(char) {
  return (['‘', '“']).includes(char);
}

function isCloseQuote(char) {
  return (['’', '”']).includes(char);
}

function isOpenDoubleQuote(char) {
  return (['“']).includes(char);
}

function isCloseDoubleQuote(char) {
  return (['”']).includes(char);
}

function tryGetNextMatchDoubleQuote(str, index) {
  if (!isOpenDoubleQuote(str[index])) {
    return { i: -1 };;
  }

  let isQuotingCn = false;
  let i = index + 1;
  let stack = [];
  while (i < str.length) {
    if (isOpenDoubleQuote(str[i])) {
      stack.push(str[i]);
    }
    if (isCloseDoubleQuote(str[i]) && stack.length == 0) {
      if (isQuotingCn) {
        return { lang: "zh", i: i };
      } else {
        return { lang: "en", i: i };
      }
    }
    if (!canBeEn(str[i])) {
      isQuotingCn = true;
    }
    i++;
  }
  return { i: -1 };
}

function openDoubleQuotingCn(str, index) {
  if (index == undefined || index < 0 || index >= str.length) {
    console.log(`Checking out of index ${index}`);
    return false;
  }
  if (index > str.length - 2) {
    // 中文引号至少要包含一个中文字符。
    // “中”
    return false;
  }
  if (isOpenDoubleQuote(str[index])) {
    let isQuotingCn = false;
    let i = index + 1;
    let stack = [];
    while (i < str.length) {
      if (isOpenDoubleQuote(str[i])) {
        stack.push(str[i]);
      }
      if (isCloseDoubleQuote(str[i])) {
        if (stack.length > 0) {
          stack.pop();
        } else {
          break;
        }
      }
      if (!canBeEn(str[i]) && stack.length == 0) {
        // 不是英文字符，且已经是最外层嵌套
        isQuotingCn = true;
        break;
      }
      i++;
    }
    return isQuotingCn;
  }

  return false;
}

function closeDoubleQuotingCn(str, index) {
  if (index == undefined || index < 0 || index >= str.length) {
    console.log(`Checking out of index ${index}`);
    return false;
  }
  if (index < 2) {
    // 中文引号至少要包含一个中文字符。
    // “中”
    return false;
  }
  if (isCloseDoubleQuote(str[index])) {
    let isQuotingCn = false;
    let i = index - 1;
    let stack = [];
    while (i >= 0) {
      if (isCloseDoubleQuote(str[i])) {
        stack.push(str[i]);
      }
      if (isOpenDoubleQuote(str[i])) {
        if (stack.length > 0) {
          stack.pop();
        } else {
          break;
        }
      }
      if (!canBeEn(str[i]) && stack.length == 0) {
        // 不是英文字符，且已经是最外层嵌套
        isQuotingCn = true;
        break;
      }
      i--;
    }
    return isQuotingCn;
  }

  return false;
}

// 目标 index 处若是引号，判断是不是英文引号
// 要求临近字符需要是英文或空格（你好 “eng” 你好）=> （你好 "eng" 你好）
function quotingEn(str, index) {
  if (index == undefined || index < 0 || index >= str.length) {
    console.log(`Checking out of index ${index}`);
    return false;
  }
  if (!isQuote(str[index])) {
    // 不是引号
    return false;
  }

  // 理论上讲开引号后、闭引号前不应该跟空格。
  if (isOpenQuote(str[index])) {
    // 开引号后，需要是英文，并且向后遍历是否是中文引号。
    let nextIsEN = (index == str.length - 1 || canBeEn(str[index + 1])) && !openDoubleQuotingCn(str, index);
    return nextIsEN;
  } else if (isCloseQuote(str[index])) {
    // 闭引号前，需要是英文。并且向前遍历是否是中文引号。
    let prevIsEN = (index == 0 || canBeEn(str[index - 1])) && !closeDoubleQuotingCn(str, index);
    return prevIsEN;
  } else if (isEnOnlyQuote(str[index])) {
    return true;
  }
}

function splitStringByLang(str) {
  let arr = [];
  let push = function(s) {
    // 合并空格
    if ((s.trim().length == 0 && arr.length != 0) || (arr.length == 1 && arr[0].trim().length == 0)) {
      arr[arr.length - 1] = arr[arr.length - 1] + s
    } else {
      arr.push(s)
    }
  }

  let lastStart = 0;
  for (let i = 0; i < str.length; i++) {
    // if (isOpenDoubleQuote(str[i])) {
    //   let matchedQuoteIndex = tryGetNextMatchDoubleQuote(str, i);
    //   if (matchedQuoteIndex.i != -1) {
    //     i = matchedQuoteIndex;
    //     push(str.slice(lastStart, i));
    //     lastStart = i;
    //     continue;
    //   }
    // }
    if (canBeEn(str[i]) && // 是英文字符
      (!isQuote(str[i]) || quotingEn(str, i))) { // 若是引号，需要是英文引号
      if (lastStart != i) {
        push(str.slice(lastStart, i));
      }
      lastStart = i;

      i++;
      while (i < str.length && canBeEn(str[i]) && // 是英文字符
        (!isQuote(str[i]) || quotingEn(str, i))) { // 若是引号，需要是英文引号
        i++;
      }
      push(str.slice(lastStart, i));
      lastStart = i;
    }
  }
  if (str.length != lastStart) {
    push(str.slice(lastStart, str.length));
  }
  return arr;
}

function sanitizer(str) {
  if (onlySpace(str)) {
    return [];
  }
  let arr = splitStringByLang(str);

  let result = [];
  let isEn = canBeEn(arr[0]) && hasEnLetter(arr[0]);
  // 由于只支持中英，实际上只需要返回第一个元素的语言即可。
  // 不过为了调用者的方便，还是算了。
  for (let i = 0; i < arr.length; i++) {
    // if (onlyNeutralCharacter(arr[i])) {
    //   result.push({
    //     lang: "",
    //     content: arr[i],
    //   });
    // } else {
    result.push({
      lang: isEn ? "en" : "zh",
      content: arr[i],
    });
    isEn = !isEn;
    // }
  }
  return result;
}


function addSpan(lang, str) {
  return `<span lang='${lang}'>${str}</span>`
}

function addCNQuote(fontFamily, canBeEmpty) {
  if (!fontFamily.includes('Chinese Quote')) {
    if(fontFamily.includes('sans')) {
      return '"Chinese Quote Sans",' + fontFamily;
    }
    return '"Chinese Quote Serif",' + fontFamily;
  }
  if (canBeEmpty) {
    return "";
  }
  return fontFamily;
}

function rmCNQuote(fontFamily, canBeEmpty) {
  if (fontFamily.includes('Chinese Quote')) {
    return fontFamily.replaceAll('"Chinese Quote Sans",', "").replaceAll('"Chinese Quote Serif",', "");
  }
  if (canBeEmpty) {
    return "";
  }
  return fontFamily;
}

function autoQuote(lang, fontFamily, canBeEmpty) {
  if (lang == "zh") {
    return addCNQuote(fontFamily, canBeEmpty);
  } else {
    // 移除 en 的 Chinese Quote
    return rmCNQuote(fontFamily, canBeEmpty);
  }
}

function tryTranspile(elem) {
  if (!elem.hasChildNodes()) {
    return;
  }
  let invalidRootElement = [
    "IMG", "CODE", "Q", "TEXTAREA", "SCRIPT", "PRE", "SVG", "PATH", "CANVAS", "NOSCRIPT", "FORM", "STYLE"
  ];
  if(elem.tagName && invalidRootElement.includes(elem.tagName.toUpperCase())) {
    return;
  }

  let validNodes = [
    Node.TEXT_NODE,
  ];
  let invalidClasses = [
    "katex",
  ];
  let invalidSubElement = [
    "IMG", "CODE", "Q", "TEXTAREA", "SCRIPT", "PRE", "SVG", "PATH", "CANVAS", "NOSCRIPT", "FORM", "STYLE"
  ];
  let invalidCurrentElement = [
    "DIV"
  ];

  let parentFontFamily = getComputedStyle(elem).fontFamily;
  for (let n = 0; n < elem.childNodes.length; n++) {
    let node = elem.childNodes[n];
    if (elem.childNodes[n].nodeType == Node.ELEMENT_NODE &&
      !invalidSubElement.includes(elem.childNodes[n].tagName.toUpperCase()) //&&
      // invalidClasses.some((klass) => elem.className.split(" ").includes(klass))
      // !elem.className.includes("katex")
    ) {
      tryTranspile(elem.childNodes[n]);
      continue;
    } else if (!validNodes.includes(elem.childNodes[n].nodeType) ||
      (elem.nodeType == Node.ELEMENT_NODE && invalidCurrentElement.includes(elem.tagName.toUpperCase()))) {
      continue;
    }

    let str = node.textContent;

    let arr = sanitizer(str);
    // console.log(elem, node,arr);
    // console.log(str)
    if (arr.length == 0) {
      continue;
    }
    if (n == 0 && elem.childNodes.length == 1 && arr.length == 1) {
      // node.lang = arr[0].lang;
      // elem.lang = arr[0].lang;
      if (hasQuote(arr[0].content)) {
        const final = autoQuote(arr[0].lang, parentFontFamily);
        console.log(str, "has lang: ", arr[0].lang, ". From: ", parentFontFamily, " to ", final)
        elem.style.fontFamily = final;
      }
      // 仅含一种语言
      continue;
    }
    // console.log(arr);
    let nextNode = elem.childNodes[n + 1];
    for (let i = 0; i < arr.length; i++) {
      let newNode;
      if (!hasQuote(arr[i].content)) {
        newNode = document.createTextNode(arr[i].content);
      } else {
        newNode = document.createElement("span");
        const final = autoQuote(arr[i].lang, parentFontFamily, true);
        console.log(str, "has lang: ", arr[0].lang, ". From: ", parentFontFamily, " to ", final)
        newNode.style.fontFamily = final;
        newNode.textContent = arr[i].content;
      }
      // newNode.lang = arr[i].lang;
      elem.insertBefore(newNode, nextNode);
    }
    elem.removeChild(node);
    n = n + arr.length - 1;
  }
}

function fuhsi() {
  let start = new Date();
  console.log("parse start", start.toISOString())
  // console.log($("div#container"))
  Array.from(document.getElementsByTagName("body")[0].children).forEach((elem, i) => {
    // console.log(elem, elem.hasChildNodes())
    tryTranspile(elem);
  })
  // $("body").each((i, elem) => {
  //   tryTranspile(elem);
  // })
  let end = new Date();
  console.log("parse end", end.toISOString(), ", take", end - start, "ms")
}

// $(document).ready(fuhsi);
