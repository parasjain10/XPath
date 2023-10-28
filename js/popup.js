document.getElementById("disable").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "disable" });
  document.getElementById("disable").classList.add("disabled");
  document.getElementById("enable").classList.remove("enabled");
});

document.getElementById("enable").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "enable" });
  document.getElementById("enable").classList.add("enabled");
  document.getElementById("disable").classList.remove("disabled");
});

document.getElementById("single").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "single" });
});
