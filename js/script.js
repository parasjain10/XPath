let xpathList = [];
let clickedElement;
let copiedKey;
let duplicateKeyCount = 0;
let result;
let style = document.createElement("style");
style.type = "text/css";
let copiedXPath = "";
style.innerHTML = `.hoverBackground { background-color: #add8e6;}  .tooltip { background-color: yellow;  padding: 5px;  maxWidth: 300px; maxHeight: 300px; white-space: normal; border: 1px solid black; border-radius: 5px; box-shadow: 0px 0px 5px black; background-size: cover; background-color: #90c44e; color: white; font-family: sans-serif; } .toast {
  position: fixed;
  top: 30px;
  right: 30px;
  padding: 15px;
  background-color: #90c44e;
  color: #fff;
  font-weight: 800;
  transform: translate(-10px, 10px);
  animation: fadein 0.6s;
  font-size: 12px;
  z-index:100000000;
}

.toast.error {
  background-color: rgba(234, 38, 23, 0.7);
}

.toast.success {
  background-color: #90c44e;
}

@keyframes fadein {
  from {
    top: 0;
    opacity: 0;
  }

  to {
    top: 30px;
    opacity: 1;
  }
} `;

let toastTimeoutId;

window.toast = function (str, extraClass = "", timeout = 5000) {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
  const div = document.createElement("div");
  div.className = "toast " + extraClass;
  div.innerHTML = str;

  setTimeout(function () {
    div.remove();
  }, timeout);
  document.body.appendChild(div);
};

document.getElementsByTagName("head")[0].appendChild(style);
const tooltipElement = document.createElement("div");
let pathString = "";
let hoveredElement;

createModal();
eventListener();

function preventDefaultAndStopPropagation(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
}

function eventListener() {
  try {
    let timeoutId;
    attachEventListeners(window);
    let iframes = document.getElementsByTagName("iframe");

    tooltipElement.classList.add("tooltip");
    tooltipElement.style.position = "absolute";
    tooltipElement.style.zIndex = "100000000000";
    document.body.appendChild(tooltipElement);

    // Attach event listeners to each iframe
    for (const element of iframes) {
      let iframe = element;

      if (iframe.contentWindow || iframe.contentDocument) {
        let innerWindow =
          iframe.contentWindow || iframe.contentDocument.defaultView;

        attachEventListeners(innerWindow);
      } else {
        // If iframe is not loaded, then attach a 'load' event listener
        iframe.addEventListener("load", function () {
          let innerWindow =
            iframe.contentWindow || iframe.contentDocument.defaultView;

          attachEventListeners(innerWindow);
        });
      }
    }

    window.addEventListener("mouseover", function (event) {
      tooltipElement.style.display = "block";
      event.stopPropagation();
      let target = getElementFromEvent(event);
      target.classList.add("hoverBackground");
    });

    function calculateTooltipPosition(tooltipElement, event) {
      // Get the tooltip's dimensions.
      let tooltipWidth = tooltipElement.offsetWidth;
      let tooltipHeight = tooltipElement.offsetHeight;

      // Calculate the tooltip's desired position.
      let tooltipTop = event.clientY + 2;
      let tooltipLeft = event.clientX + 2;

      // Check if the tooltip is going off the top of the screen.
      if (tooltipTop < 2) {
        // Adjust the tooltip's top position so that it doesn't go off the screen.
        tooltipTop = 2;
      }

      // Check if the tooltip is going off the bottom of the screen.
      if (tooltipTop + tooltipHeight > window.innerHeight) {
        // Adjust the tooltip's top position so that it doesn't go off the screen.
        tooltipTop = window.innerHeight - tooltipHeight - 2;
      }

      // Check if the tooltip is going off the left side of the screen.
      if (tooltipLeft < 2) {
        // Adjust the tooltip's left position so that it doesn't go off the screen.
        tooltipLeft = 2;
      }

      // Check if the tooltip is going off the right side of the screen.
      if (tooltipLeft + tooltipWidth > window.innerWidth) {
        // Adjust the tooltip's left position so that it doesn't go off the screen.
        tooltipLeft = window.innerWidth - tooltipWidth - 2;
      }

      // Set the tooltip's position.
      tooltipElement.style.top = tooltipTop + window.scrollY + "px";
      tooltipElement.style.left = tooltipLeft + window.scrollX + "px";
    }

    function attachEventListeners(targetWindow) {
      targetWindow.addEventListener("scroll", (event) => {
        tooltipElement.style.display = "none";
      });

      targetWindow.ondblclick = function (event) {
        if (toastTimeoutId) {
          clearTimeout(toastTimeoutId);
        }
        let element = getElementFromEvent(event);
        if (element.tagName.toLowerCase() === "select") {
          showModal(element);
          return;
        }
        if (element.tagName.toLowerCase() === "option") {
          showModal(element?.parentNode);
          return;
        } else if (element && element.id.includes("sel-button")) {
          return;
        }
        timeoutId = setTimeout(() => {
          document.activeElement.blur();
          setTimeout(() => {
            getXPath(getElementFromEvent(event), "ONDBLCLICK");
          }, 100);
        }, 300);
      };

      targetWindow.addEventListener("mouseover", function (event) {
        tooltipElement.style.display = "block";
        event.stopPropagation();
        let target = getElementFromEvent(event);
        target.classList.add("hoverBackground");
        hoveredElement = target;

        calculateTooltipPosition(tooltipElement, event);

        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        let element = getElementFromEvent(event);
        if (
          element.tagName.toLowerCase() === "html" ||
          element.tagName.toLowerCase() === "body"
        ) {
          return;
        }
        if (element && element.id.includes("sel-button")) {
          return;
        }
        timeoutId = setTimeout(() => {
          setTimeout(() => {
            getXPath(getElementFromEvent(event), "ONHOVER");
          }, 900);
        }, 300);
      });

      targetWindow.addEventListener("keydown", function (event) {
        if (event.shiftKey && event.key === "A") {
          // check if shift + A is pressed
          if (hoveredElement) {
            if (toastTimeoutId) clearTimeout(toastTimeoutId);
            copyString();
          }
        }
      });
    }

    window.onmousemove = (event) => {
      tooltipElement.style.display = "none";
    };

    window.onmouseout = function (event) {
      removeBackground(event);
      tooltipElement.style.display = "none";
      clearTimeout(timeoutId);
    };
    postDropdownPopup();
  } catch (err) {}
}

const automationGetTooltipInfo = (targetElement) => {
  let tooltipAttribute = "";
  let tooltipValue = "";
  // Check if the target element has a 'title' attribute
  if (!targetElement.hasAttribute) {
    return {};
  }
  if (targetElement.hasAttribute("title")) {
    tooltipAttribute = "title";
    tooltipValue = targetElement.getAttribute("title");
  }
  if (targetElement.hasAttribute("aria-label")) {
    tooltipAttribute = "aria-label";
    tooltipValue = targetElement.getAttribute("aria-label");
  }
  // Check if the target element has an 'aria-describedby' attribute
  else if (targetElement.hasAttribute("aria-describedby")) {
    tooltipAttribute = "aria-describedby";
    let tooltipId = targetElement.getAttribute("aria-describedby");
    let tooltipElement = document.getElementById(tooltipId);
    if (tooltipElement) {
      tooltipValue = tooltipElement.innerText;
    }
  }

  return tooltipAttribute && tooltipValue
    ? { tooltipAttribute, tooltipValue }
    : {};
};

function getXPath(target, type) {
  let path = getPathTo(target);
  let key = getUniqueKey(target);
  key = key.toLowerCase();
  duplicateKeyCount = 0;
  key = updateKey(key, true);
  let xpathObj = {};
  xpathObj["key"] = key;
  xpathObj["xpath"] = path;
  pathString = key + "->" + path;
  tooltipElement.style.display = "block";
  tooltipElement.style.wordWrap = "break-word"; // This will break the word to next line
  tooltipElement.style.whiteSpace = "normal";
  tooltipElement.innerHTML = pathString;
  xpathList.push(xpathObj);
  copiedXPath = pathString;
  if (type === "ONDBLCLICK") copyString(pathString);
}

function generateXPathFromAttributes(element) {
  let xpath = "";
  for (const attributeName in element.attributes) {
    const attributeValue = element.attributes[attributeName]?.value;
    const attributeOriginalName = element.attributes[attributeName]?.localName;
    if (attributeName === "id") {
      // Add an XPath expression for the SVG element's ID.
      xpath += `[@id='${attributeValue}']`;
    } else if (attributeOriginalName === "viewBox") {
      xpath += `[@viewBox='${attributeValue}']`;
    } else if (
      attributeOriginalName &&
      attributeValue &&
      isAttributeUnique(attributeOriginalName, attributeValue)
    ) {
      // Add an XPath expression for the SVG element's attribute.
      if (attributeValue.length < 40)
        xpath += `[@${attributeOriginalName}='${attributeValue}']`;
    }
  }
  return xpath;
}

function getSvgElementXPath(element) {
  let parentXPath = "";
  let xpath =
    element.tagName === "svg"
      ? `//*[local-name()='${element.tagName}']`
      : "//i";
  // Add XPath expressions for any unique attributes of the SVG element.
  let indexValue = uniqueElementXPath(element);
  if (indexValue > 1) {
    parentXPath = getPathTo(element?.parentNode);
  }
  const index = indexValue === 1 ? "" : `[${indexValue}]`;
  const XPathFromAtrribute = generateXPathFromAttributes(element);

  xpath += generateXPathFromAttributes(element) + index;

  return parentXPath
    ? parentXPath + xpath
    : XPathFromAtrribute
    ? "" + xpath
    : getPathTo(element?.parentNode) + xpath;
}

function checkElementFrequency(tagName, textContent) {
  let elements = document.getElementsByTagName(tagName);
  let count = 0;
  for (const element of elements) {
    if (element.textContent.trim() === textContent.trim()) {
      count++;
    }
  }
  return count > 1;
}

const SVG_SHAPES_TAGNAME = [
  "rect",
  "path",
  "circle",
  "g",
  "polyline",
  "ellipse",
  "polygon",
];

const SVG_I = ["svg", "I"];

function findParentSvg(element) {
  while (element) {
    if (element.tagName.toLowerCase() === "svg") {
      return element;
    }
    element = element.parentNode;
  }
  return null; // Return null if no SVG parent is found
}

function getPathTo(element, withLocators) {
  const positionOfElement = uniqueElementXPath(element);

  if (positionOfElement > 1) {
    return getFullXPath(element, positionOfElement);
  }

  let { tooltipAttribute, tooltipValue } = automationGetTooltipInfo(element);
  if (
    SVG_I.includes(element?.tagName) ||
    element?.parentNode?.nodeName === "svg" ||
    SVG_SHAPES_TAGNAME.includes(element?.tagName)
  ) {
    const isShape = SVG_SHAPES_TAGNAME.includes(element?.tagName);
    let svgElementXPath = getSvgElementXPath(
      isShape ? findParentSvg(element) : element
    );

    return (
      getPathTo(findParentSvg(element)?.parentNode, true) + svgElementXPath
    );
    // return svgElementXPath;
  }

  if (element.tagName === "IMG") {
    let imageSrc = element.outerHTML.match(/src='([^']+)'/i)[1];
    if (imageSrc?.length < 40)
      return isAttributeUnique("src", imageSrc)
        ? `//img[@src='${imageSrc}']`
        : getPathTo(element?.parentNode) + `//img[@src='${imageSrc}']`;
    else if (element?.alt)
      return isAttributeUnique("alt", element?.alt)
        ? `//img[@alt='${element.alt}']`
        : getPathTo(element?.parentNode) + `//img[@alt='${element.alt}']`;
  }

  if (
    (getTextContent(element)?.length > 0 &&
      element.nodeType === Node.ELEMENT_NODE) ||
    element.nodeType === Node.TEXT_NODE
  ) {
    let textContent = getTextContent(element);
    if (
      element.tagName === "a" ||
      (element.tagName === "A" &&
        !checkElementFrequency(element.tagName, element.textContent) &&
        !withLocators)
    ) {
      return `By.linkText('${textContent}')`;
    } else if (
      element.id !== "" &&
      isAttributeUnique("id", element.id) &&
      !withLocators
    ) {
      return `By.id('${element.id}')`;
    } else {
      return (
        getPathTo(element?.parentNode, true) +
        "//" +
        element.tagName.toLowerCase() +
        `[normalize-space(text())='${textContent}']`
      );
    }
  }

  if (
    element.id !== "" &&
    isAttributeUnique("id", element.id) &&
    !withLocators
  ) {
    return `By.id('${element.id}')`; // By.id='value'
  } else if (
    element.name &&
    isAttributeUnique("name", element.name) &&
    !withLocators
  ) {
    try {
      return `By.name('${element.name}')`;
    } catch (error) {
      console.err("bad");
    }
  } else if (
    element.placeholder &&
    isAttributeUnique("placeholder", element.placeholder)
  ) {
    return "//input[@placeholder='' + element.placeholder + '']";
  } else if (
    tooltipAttribute &&
    tooltipValue &&
    isAttributeUnique(tooltipAttribute + "", tooltipValue + "")
  ) {
    let tooltipXPath = "//*[@' + tooltipAttribute + '='' + tooltipValue + '']";
    return tooltipXPath;
  } else if (
    element.className &&
    isElementClassUnique(element.className, element.tagName.toLowerCase())
  ) {
    let classes = element.className
      .split(" ")
      ?.filter((classDetail) => classDetail);
    let elementContains = "";
    for (let i = 0; i < classes.length; i++) {
      if (i != 0) {
        elementContains += " and ";
      }
      elementContains += "contains(@class, '' + classes[i] + '')";
    }
    return "//" + element?.tagName?.toLowerCase() + "[" + elementContains + "]";
  } else if (element.tagName === "body" || element === document.body) {
    return "/html/" + element.tagName.toLowerCase();
  } else if (generateXPathFromAttributes(element)) {
    return `//${element.tagName}` + generateXPathFromAttributes(element);
  } else if (getFullXPath(element)) {
    return getFullXPath(element);
  } else if (element.nodeName === "#document") {
    //Do nothing
    return "";
  } else {
    return "//" + element?.tagName?.toLowerCase();
  }
}

function uniqueElementXPath(element) {
  if (!element || !element.parentNode) {
    return;
  }
  let count = 0;
  const siblings = element?.parentNode?.children;
  for (let sibling of siblings) {
    if (sibling === element) {
      count++;
      return count;
    } else if (sibling.tagName === element.tagName) {
      count++;
    }
  }
}

function getFullXPath(element, position) {
  if (!element || !element.parentNode) {
    return;
  }
  let ix = 0;
  let siblings = element?.parentNode?.childNodes;
  for (let sibling of siblings) {
    if (sibling === element) {
      let hierarchyPath =
        getPathTo(element?.parentNode, true) +
        "/" +
        element.tagName.toLowerCase() +
        "[" +
        (position || ix + 1) +
        "]";
      return hierarchyPath && hierarchyPath;
    } else if (
      sibling.nodeType === 1 &&
      sibling.tagName === element.tagName.toLowerCase()
    )
      ix++;
  }
}

function createOptionButton(id, text, value, className) {
  const button = document.createElement("div");
  button.className = !className
    ? "option-select-button"
    : `${className} option-select-button`;
  button.setAttribute("id", id);
  button.textContent = text;
  button.setAttribute("value", value);
  return button;
}

function showModal(select) {
  let modal = document.getElementById("automationModal");
  let modalOptions = document.getElementById("automationModalSubContent");
  let options = select.options;

  modalOptions.innerHTML = "";

  const selectButton = createOptionButton("sel-button", "Select");
  modalOptions.appendChild(selectButton);
  selectButton.addEventListener("dblclick", () => {
    getXPath(select);
    select.dispatchEvent(new Event("change"));
    postDropdownPopup();
    closeModal();
  });

  for (const element of options) {
    let option = element;
    const optionButton = createOptionButton(
      `${option.value} sel-button-option`,
      option.text,
      option.value,
      select.value === option.value
        ? "option-select-button option-select-button-selected"
        : ""
    );
    optionButton.addEventListener("dblclick", () => {
      select.value = option.value;
      getXPath(option);
      select.dispatchEvent(new Event("change"));
      postDropdownPopup();
      closeModal();
    });
    modalOptions.appendChild(optionButton);
  }
  modal.style.display = "block";

  //<------------------------------------------------------------------------------>

  let closeBtn = document.getElementsByClassName("modal-close")[0];
  closeBtn.addEventListener("click", function () {
    closeModal();
  }); // This closes the modal when clicked on cross icon/button

  window.addEventListener("click", function (event) {
    if (event.target == modal) {
      closeModal();
    }
  }); // this closes the modal when clicked other than the modal

  function closeModal() {
    modal.style.display = "none";
  }

  //<------------------------------------------------------------------------------->
}

function updateKey(keyValue, duplicate = false) {
  if (duplicate) {
    copiedKey = keyValue;
  }

  let checkKey = xpathList.find((o) => o.key === keyValue);
  if (!checkKey) {
    return keyValue;
  }
  keyValue = copiedKey;
  duplicateKeyCount += 1;
  keyValue += "_" + duplicateKeyCount;
  return updateKey(keyValue);
}

function getUniqueKey(element) {
  let textOrLabel = "";
  let key = "";
  if (
    element.tagName === "INPUT" &&
    ((element.previousElementSibling &&
      element.previousElementSibling.innerText) ||
      element.placeholder)
  ) {
    key += element.type + "_";
    textOrLabel =
      element.placeholder || element.previousElementSibling.innerText;
  } else {
    textOrLabel = element.textContent;
  }
  key += element.nodeName + "_" + transformString(textOrLabel);
  return key;
}

function transformString(textStr) {
  textStr = textStr.replace(/\\\\\\\\s+/g, " ").trim();
  let maxLength = 20; // maximum number of characters to extract
  let trimmedString = "";
  if (textStr.length > maxLength) {
    trimmedString = textStr.substr(0, maxLength);

    //re-trim if we are in the middle of a word
    trimmedString = trimmedString.substring(
      0,
      Math.min(trimmedString.length, trimmedString.lastIndexOf(" "))
    );
  }
  return trimmedString
    ? trimmedString.split(" ").join("_")
    : textStr.split(" ").join("_");
}

function copyString(targetString) {
  navigator.clipboard
    .writeText(copiedXPath ?? targetString)
    .then(() => {
      toast("Path Copied Successfully", "success", 3000);
      console.log("Text copied to clipboard");
    })
    .catch((err) => {
      console.error("Unable to copy text to clipboard", err);
    });
}

function getTextContent(element) {
  for (let childNode of element.childNodes) {
    if (childNode.nodeType === 3) {
      return childNode.textContent.trim();
    }
  }
  return null;
}

function getCssPath(el) {
  if (!(el instanceof Element)) return;
  let path = [];
  while (el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.id) {
      selector += "#" + el.id;
      path.unshift(selector);
      break;
    } else {
      let sib = el,
        nth = 1;
      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName.toLowerCase() == selector) nth++;
      }
      if (nth != 1) selector += ":nth-of-type(" + nth + ")";
    }
    path.unshift(selector);
    el = el.parentNode;
  }
  return path.join(" > ");
}

function getPageXY(element) {
  let x = 0,
    y = 0;
  while (element) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  }
  return [x, y];
}

function isAttributeUnique(attrName, attrValue) {
  try {
    return (
      document.querySelectorAll("[' + attrName + '='' + attrValue + '']")
        .length == 1
    );
  } catch (error) {}
}

function isElementClassUnique(className, tagName) {
  let elements = document.getElementsByClassName(className);
  let similarElementsCount = 0;
  for (const element of elements) {
    if (element.tagName == tagName) {
      similarElementsCount += 1;
    }
  }
  return similarElementsCount == 1;
}

//This is create modal function we can change our styles here
function createModal() {
  // Create the modal container
  let modalContainer = document.createElement("div");
  modalContainer.className = "automation-modal";
  modalContainer.setAttribute("id", "automationModal");

  // Create the modal content
  let modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.setAttribute("id", "automationModalContent");

  let modalHeading = document.createElement("div");
  modalHeading.className = "modal-heading";
  modalHeading.setAttribute("id", "automationModalHeading");

  let modalSubContent = document.createElement("div");
  modalSubContent.className = "modal-sub-content";
  modalSubContent.setAttribute("id", "automationModalSubContent");

  // Create the close button
  let closeButton = document.createElement("span");
  closeButton.className = "modal-close";
  closeButton.innerHTML = "&times;";

  // Append the close button to the modal content
  modalContent.appendChild(modalHeading);
  modalContent.appendChild(modalSubContent);

  modalHeading.appendChild(closeButton);

  // Append the modal content to the modal container
  modalContainer.appendChild(modalContent);

  // Append the modal container to the document body
  document.body.appendChild(modalContainer);
}

function postDropdownPopup() {
  let selects = document.querySelectorAll("select");
  selects.forEach(function (select) {
    if (!select.multiple) {
      select.addEventListener("mousedown", function (event) {
        event.preventDefault(); // Prevent default mousedown behavior
      });
    }
  });
}

function getElementFromEvent(event) {
  if (event === undefined) event = window.event;
  let target = "target" in event ? event.target : event.srcElement;
  return target;
}
function changeBackground(event) {
  let target = getElementFromEvent(event);
  target.classList.add("hoverBackground");
}

function removeBackground(event) {
  let target = getElementFromEvent(event);
  target.classList.remove("hoverBackground");
  tooltipElement.style.display = "none";
}

// Create the style tag
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  .automation-modal {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    background-color: #fff;
    margin: 10% auto;
    width: 80%;
    max-width: 828px;
    border-radius: 12px;
  }

  .modal:before {
      display: none;
}
  .modal-sub-content {
    max-height: 340px;
    overflow: auto;
    padding: 10px 40px;
    font-family: Verdana, sans-serif;
  }

  .modal-close {
    color: white;
    cursor: pointer;
    font-size: 20px;
    height: 24px;
    width: 24px;
    background: #EA5920;
    border-radius: 50%;
    text-align: center
  }

  .option-select-button {
    padding: 12px;
    height: 40px;
    display: flex;
    align-items: center;
    color: rgba(26, 26, 26, 0.8956);
    border-radius: 8px;
    font-size: 16px
  }

  .option-select-button-selected {
    background: #F0F0F0;
  }

  .modal-heading {
    height: 48px;
    background: #000000;
    border-radius: 8px 8px 0px 0px;
    display: flex;
    align-items: center;
    justify-content: end;
    padding: 8px 16px;
    box-sizing: border-box
  }
`;
document.head.appendChild(styleTag);
