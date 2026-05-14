export const templates = {'template.html': (() => { function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>\n      ";
output += runtime.suppressValue((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint"))),"props")),"http://schema.org/name")?runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint"))),"props")),"http://schema.org/name")),"fwd")),0)),"value"):""), env.opts.autoescape);
output += "\n    </title>\n    <style>\n      body {\n        font-family: Arial, Helvetica, sans-serif;\n        font-size: 1vw;\n        margin: 0;\n      }\n      h3 {\n        font-size: 0.6em;\n        line-height: 0;\n        margin-bottom: 4px;\n        margin-top: 2em;\n      }\n\n      h2.id {\n        font-size: 0.5em;\n        margin-top: 1.25em;\n        font-weight: lighter;\n      }\n      .long {\n        overflow: scroll;\n        max-height: 10em;\n      }\n      .entity {\n        display: none;\n        position: static;\n        top: 0;\n        width: 100%;\n        z-index: 1000;\n        padding: 0px;\n        scroll-margin-top: 600px;\n      }\n      .entity:target {\n        display: block;\n      }\n\n      .entity a {\n        text-decoration: underline dotted 2px;\n        line-height: 2em;\n        text-underline-offset: 5px;\n        color: #000;\n      }\n\n      .entity-grid {\n        margin: 0px auto;\n        display: flex;\n        flex-direction: column;\n        gap: 0px;\n        width: 100%;\n      }\n\n      /*  .roots {\n        margin-bottom: 100vh; /* Adds a whole screen of blank space \n    }\n        */\n\n      .entity:target {\n        display: block;\n        scroll-margin-top: 0; /* Ensures the entity is at the top of the viewport */\n      }\n\n      span.type {\n        padding: 0px 5px;\n        margin-right: 5px;\n        font-size: 0.6em;\n        font-weight: lighter;\n        display: inline-block;\n      }\n\n      span.type::after {\n        content: \"\\a\";\n        white-space: pre;\n      }\n\n      .entity-header-row span.type::after {\n        content: \"\";\n      }\n\n      span.info a {\n        text-decoration: none;\n        font-size: 0.9em;\n      }\n\n      .button-left,\n      .button-right {\n        margin-bottom: 10px;\n        padding: 2px 10px;\n        padding: 0;\n        cursor: pointer;\n        display: inline-flex;\n        align-items: center;\n        gap: 5px;\n      }\n\n      .button-left:hover,\n      .button-right:hover {\n        color: #4e4e4e;\n      }\n\n      .button-left a::before {\n        content: \"⏴\";\n        font-size: 1.2em;\n      }\n\n      .button-right a::after {\n        content: \"⏵\";\n        font-size: 1.2em;\n      }\n\n      .button-left a,\n      .button-right a {\n        text-decoration: underline dotted 2px;\n        line-height: 2em;\n        text-underline-offset: 5px;\n        transition: all 0.3s ease-in;\n        color: #000000;\n      }\n\n      .button-left a:hover,\n      .button-right a:hover {\n        color: #4e4e4e;\n      }\n\n      .property-grid {\n        margin: 0px auto;\n        display: flex;\n        flex-direction: column;\n        gap: 0px;\n\n        width: 60%;\n      }\n\n      .property-row {\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        padding: 15px 50px;\n      }\n\n      .property-row a {\n        text-decoration: underline dotted 2px;\n        line-height: 2em;\n        text-underline-offset: 5px;\n        transition: all 0.3s ease-in;\n        color: #000000;\n      }\n\n      .entity-header-row {\n        width: 100%;\n        padding: 15px;\n        padding-bottom: 25px;\n        background-color: rgb(0, 0, 0);\n        color: #fff;\n        font-size: 2em;\n        font-weight: bold;\n        text-align: center;\n      }\n\n      .entity-header-row h2 {\n        align-items: center;\n        text-align: center;\n        line-height: 1.1em;\n        margin-bottom: 0px;\n        justify-content: center; /* Center horizontally */\n      }\n\n      .entity-header-row .info {\n        text-decoration: none;\n        font-size: 0.75em;\n      }\n\n      .entity-header-row a {\n        color: #fff;\n        text-decoration: none;\n        font-size: 0.5em;\n        font-weight: bold;\n        line-height: 1.25;\n        margin-top: 0;\n        padding-top: 0;\n        text-decoration: underline dotted 2px;\n        text-underline-offset: 5px;\n      }\n\n      .entity-header-row p {\n        font-size: 0.6em;\n        display: inline;\n      }\n\n      .property-header-row {\n        display: flex;\n        justify-content: left; /* Center horizontally */\n        align-items: center;\n        text-align: center;\n        padding: 25px 50px;\n        margin-top: 20px;\n        border-radius: 10px 10px 0 0;\n        background-color: rgb(0, 0, 0);\n        color: #fff;\n        font-size: 1.5vw;\n        font-weight: bold;\n        text-transform: capitalize;\n      }\n      .property-row:nth-child(odd) {\n        background-color: #f9fbf9;\n      }\n\n      .property-row:nth-child(even) {\n        height: 20%;\n        background-color: #f0f0ee;\n      }\n\n      .property-row:last-child {\n        margin-bottom: 25px;\n      }\n\n      .property-name {\n        flex: 1;\n        font-weight: bold;\n      }\n      .property-name a {\n        color: #000000;\n        text-decoration: none;\n        transition: all 0.2s ease-in;\n        font-size: 1em;\n      }\n\n      .property-name a:hover {\n        color: #000000;\n      }\n\n      .property-value {\n        flex: 2;\n        gap: 5px;\n        align-items: left;\n      }\n\n      .section_head {\n        width: 100%;\n        display: flex;\n        padding: 5px 0px;\n        background-color: #6c6a6a;\n      }\n\n      .section_head h2 {\n        width: 60%;\n        margin: 0 auto;\n        font-size: 1.5em;\n        color: #fff;\n      }\n\n      .browse {\n        display: flex;\n        flex-direction: column;\n        width: 60%;\n        margin: 0 auto;\n        justify-content: center;\n        align-items: center;\n        margin-bottom: 20px;\n        margin-top: 10px;\n      }\n      .browse nav {\n        width: 100%;\n        padding-top: 10px;\n      }\n\n      .browse p {\n        display: inline;\n        margin-left: 5px;\n      }\n\n      .find_button {\n        background-color: #000000;\n        color: white !important;\n        padding: 14px 25px;\n        text-align: center;\n        border-radius: 4px;\n        text-decoration: none !important;\n        display: inline-block;\n        margin-left: 5px;\n      }\n\n      .centered-files {\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        flex-direction: column;\n        width: 100vw;\n      }\n\n      .centered-files a {\n        display: block;\n        margin-top: 25px;\n        margin-bottom: 25px;\n      }\n\n      select {\n        all: unset;\n        max-width: 35%;\n        line-height: 1.5em;\n        padding: 0.5em 3.5em 0.5em 1em;\n        border-bottom: 1px solid #4e4e4e;\n        background-color: #f1f1f1;\n\n        /*This is the arrow */\n        background-image:\n          linear-gradient(45deg, transparent 50%, rgb(111, 111, 111) 50%),\n          linear-gradient(135deg, rgb(111, 111, 111) 50%, transparent 50%);\n        background-position:\n          calc(100% - 20px) calc(1em + 0px),\n          calc(100% - 15px) calc(1em + 0px),\n          100% 0;\n        background-size:\n          5px 5px,\n          5px 5px,\n          2.5em 2.5em;\n        background-repeat: no-repeat;\n      }\n\n      .drop-down {\n        display: none;\n        position: static;\n        top: 0;\n        width: 100%;\n        z-index: 1000;\n        padding: 0px;\n        scroll-margin-top: 600px;\n      }\n\n      .drop-down:target {\n        display: block;\n      }\n\n      .drop-down a {\n        text-decoration: underline dotted 2px;\n        line-height: 2em;\n        text-underline-offset: 5px;\n        color: #000;\n      }\n\n      iframe {\n        background-color: #f5f5f5;\n        border: none;\n        padding: 35px;\n      }\n\n      .home-link {\n        font-size: 0.5em !important;\n      }\n\n      .home-link a {\n        font-weight: 100 !important;\n        font-size: 14px !important;\n      }\n      /*-- this is a test comment*/\n\n      /*.property-value button {\n    margin-bottom: 5px;\n    padding: 2px 10px;\n    border: none;\n    border-bottom: dotted 2px;\n    cursor: pointer;\n    transition: all .2s ease-in;\n    color: #000000;\n}\n\n.property-value button a {\n    text-decoration: none;\n    font-weight: bold;\n    color: #000000;\n}\n\n.property-value button a:hover {\n    color: #4e4e4e; \n} */\n    </style>\n\n    <script>\n      function search(input) {\n        li = input.parentNode.getElementsByTagName(\"div\");\n        filter = input.value.toUpperCase();\n        count = li.length;\n        found = 0;\n        for (i = 0; i < li.length; i++) {\n          txtValue = li[i].textContent.toUpperCase() || \"\";\n          if (txtValue.indexOf(filter) > -1) {\n            li[i].style.display = \"\";\n            found++;\n          } else {\n            li[i].style.display = \"none\";\n          }\n        }\n        input.parentNode.getElementsByClassName(\"count\")[0].innerText =\n          `${found - 1} /  ${count - 1}`;\n      }\n    </script>\n  </head>\n\n  <body>";
var macro_t_1 = runtime.makeMacro(
["url"], 
[], 
function (l_url, kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
frame.set("url", l_url);
var t_2 = "";if(l_url) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),l_url)) {
t_2 += "\n          <a\n            href=\"#";
t_2 += runtime.suppressValue(l_url, env.opts.autoescape);
t_2 += "\"\n            title=\"See definiton for ";
t_2 += runtime.suppressValue(l_url, env.opts.autoescape);
t_2 += " in this RO-Crate\"\n          >\n            ⓘ\n          </a>\n        ";
;
}
else {
t_2 += "\n          <a\n            href=\"";
t_2 += runtime.suppressValue(l_url, env.opts.autoescape);
t_2 += "\"\n            title=\"Look up definiton for ";
t_2 += runtime.suppressValue(l_url, env.opts.autoescape);
t_2 += "\"\n            target=\"_blank\"\n          >\n            ⓘ\n          </a>";
;
}
;
}
;
frame = callerFrame;
return new runtime.SafeString(t_2);
});
context.addExport("infoLink");
context.setVariable("infoLink", macro_t_1);
var macro_t_3 = runtime.makeMacro(
["propData"], 
[], 
function (l_propData, kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
frame.set("propData", l_propData);
var t_4 = "";t_4 += "\n      ";
t_4 += runtime.suppressValue(env.getFilter("replace").call(context, runtime.memberLookup((l_propData),"label"),/.*:/,""), env.opts.autoescape);
t_4 += "\n      ";
t_4 += runtime.suppressValue((lineno = 428, colno = 17, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "infoLink"), "infoLink", context, [runtime.memberLookup((l_propData),"url")])), env.opts.autoescape);
;
frame = callerFrame;
return new runtime.SafeString(t_4);
});
context.addExport("diplayLabel");
context.setVariable("diplayLabel", macro_t_3);
var macro_t_5 = runtime.makeMacro(
["url"], 
[], 
function (l_url, kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
frame.set("url", l_url);
var t_6 = "";if(l_url) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),l_url)) {
t_6 += "\n          <span class=\"info\"><a href=\"#";
t_6 += runtime.suppressValue(l_url, env.opts.autoescape);
t_6 += "\">ⓘ</a></span>";
;
}
else {
t_6 += "\n          <span class=\"info\"> <a href=\"";
t_6 += runtime.suppressValue(l_url, env.opts.autoescape);
t_6 += "\" target=\"_blank\">ⓘ</a></span>";
;
}
;
}
;
frame = callerFrame;
return new runtime.SafeString(t_6);
});
context.addExport("infoLink");
context.setVariable("infoLink", macro_t_5);
var macro_t_7 = runtime.makeMacro(
["prop", "propData"], 
[], 
function (l_prop, l_propData, kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
frame.set("prop", l_prop);
frame.set("propData", l_propData);
var t_8 = "";t_8 += "\n      <div class=\"property-row\">\n        <div class=\"property-name\">";
t_8 += runtime.suppressValue((lineno = 444, colno = 49, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "diplayLabel"), "diplayLabel", context, [l_propData])), env.opts.autoescape);
t_8 += "</div>\n        <div class=\"property-value\">";
var t_9;
t_9 = runtime.memberLookup((runtime.memberLookup((l_propData),"fwd")),"length") + runtime.memberLookup((runtime.memberLookup((l_propData),"rev")),"length") > 9;
frame.set("isLong", t_9, true);
if(frame.topLevel) {
context.setVariable("isLong", t_9);
}
if(frame.topLevel) {
context.addExport("isLong", t_9);
}
if(runtime.contextOrFrameLookup(context, frame, "isLong")) {
t_8 += "\n            <input class=\"border\" onkeyup=\"res = search(this)\" />\n            <span class=\"count\">\n              (";
t_8 += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((l_propData),"fwd")),"length") + runtime.memberLookup((runtime.memberLookup((l_propData),"rev")),"length"), env.opts.autoescape);
t_8 += " /\n              ";
t_8 += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((l_propData),"fwd")),"length") + runtime.memberLookup((runtime.memberLookup((l_propData),"rev")),"length"), env.opts.autoescape);
t_8 += ")</span\n            >";
;
}
t_8 += "\n          <div class=\"";
t_8 += runtime.suppressValue((runtime.contextOrFrameLookup(context, frame, "isLong")?"long":"short"), env.opts.autoescape);
t_8 += "\">";
frame = frame.push();
var t_12 = runtime.memberLookup((l_propData),"fwd");
if(t_12) {t_12 = runtime.fromIterator(t_12);
var t_11 = t_12.length;
for(var t_10=0; t_10 < t_12.length; t_10++) {
var t_13 = t_12[t_10];
frame.set("val", t_13);
frame.set("loop.index", t_10 + 1);
frame.set("loop.index0", t_10);
frame.set("loop.revindex", t_11 - t_10);
frame.set("loop.revindex0", t_11 - t_10 - 1);
frame.set("loop.first", t_10 === 0);
frame.set("loop.last", t_10 === t_11 - 1);
frame.set("loop.length", t_11);
t_8 += "\n              <div>";
if(env.getTest("string").call(context, t_13) === true) {
t_8 += "\n                  ";
t_8 += runtime.suppressValue(env.getFilter("safe").call(context, env.getFilter("urlize").call(context, t_13)), env.opts.autoescape);
;
}
else {
if(runtime.memberLookup((t_13),"url")) {
t_8 += "\n                  <a href=\"";
t_8 += runtime.suppressValue(runtime.memberLookup((t_13),"url"), env.opts.autoescape);
t_8 += "\"> ";
t_8 += runtime.suppressValue(runtime.memberLookup((t_13),"url"), env.opts.autoescape);
t_8 += "</a>";
;
}
else {
if(runtime.memberLookup((t_13),"target_id")) {
t_8 += "\n                    <span class=\"button-right\">\n                      <a href=\"#";
t_8 += runtime.suppressValue(env.getFilter("urlencode").call(context, runtime.memberLookup((t_13),"target_id")), env.opts.autoescape);
t_8 += "\">\n                        ";
t_8 += runtime.suppressValue(runtime.memberLookup((t_13),"target_name"), env.opts.autoescape);
t_8 += "\n                      </a>\n                    </span>";
;
}
else {
if(env.getTest("string").call(context, runtime.memberLookup((t_13),"value")) === true) {
t_8 += "\n                    ";
t_8 += runtime.suppressValue(env.getFilter("safe").call(context, env.getFilter("urlize").call(context, runtime.memberLookup((t_13),"value"))), env.opts.autoescape);
;
}
else {
if(runtime.memberLookup((t_13),"value")) {
t_8 += "\n                    ";
t_8 += runtime.suppressValue(runtime.memberLookup((t_13),"value"), env.opts.autoescape);
;
}
else {
t_8 += "\n                    WARNING SOMETHING WENT WRONG ";
t_8 += runtime.suppressValue(env.getFilter("dump").call(context, t_13), env.opts.autoescape);
;
}
;
}
;
}
;
}
;
}
if(runtime.memberLookup((t_13),"mapImage")) {
t_8 += "\n                  <p>Map images:</p>\n                  <img\n                    src=\"";
t_8 += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_13),"mapImage")),"world"), env.opts.autoescape);
t_8 += "\"\n                    alt=\"World Map\"\n                    style=\"width: 100%; height: auto;\"\n                  />\n                  <img\n                    src=\"";
t_8 += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_13),"mapImage")),"main"), env.opts.autoescape);
t_8 += "\"\n                    alt=\"Localized Map\"\n                    style=\"width: 100%; height: auto;\"\n                  />";
;
}
t_8 += "\n              </div>";
;
}
}
frame = frame.pop();
frame = frame.push();
var t_16 = runtime.memberLookup((l_propData),"rev");
if(t_16) {t_16 = runtime.fromIterator(t_16);
var t_15 = t_16.length;
for(var t_14=0; t_14 < t_16.length; t_14++) {
var t_17 = t_16[t_14];
frame.set("val", t_17);
frame.set("loop.index", t_14 + 1);
frame.set("loop.index0", t_14);
frame.set("loop.revindex", t_15 - t_14);
frame.set("loop.revindex0", t_15 - t_14 - 1);
frame.set("loop.first", t_14 === 0);
frame.set("loop.last", t_14 === t_15 - 1);
frame.set("loop.length", t_15);
t_8 += "\n              <div>";
if(runtime.memberLookup((t_17),"target_id")) {
t_8 += "\n                  <span class=\"button-left\">\n                    <a href=\"#";
t_8 += runtime.suppressValue(env.getFilter("urlencode").call(context, runtime.memberLookup((t_17),"target_id")), env.opts.autoescape);
t_8 += "\">\n                      ";
t_8 += runtime.suppressValue(runtime.memberLookup((t_17),"target_name"), env.opts.autoescape);
t_8 += "\n                    </a>\n                  </span>";
;
}
else {
t_8 += "\n                  WARNING SOMETHING WENT WRONG ";
t_8 += runtime.suppressValue(env.getFilter("dump").call(context, t_17), env.opts.autoescape);
t_8 += " ⬅";
;
}
t_8 += "\n              </div>";
;
}
}
frame = frame.pop();
t_8 += "\n          </div>\n        </div>\n      </div>";
;
frame = callerFrame;
return new runtime.SafeString(t_8);
});
context.addExport("displayProp");
context.setVariable("displayProp", macro_t_7);
var macro_t_18 = runtime.makeMacro(
[], 
[], 
function (kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
var t_19 = "";t_19 += "\n      <select onchange=\"location.href=this.value\">\n        <option value=\"disabled selected\">Select a type</option>";
frame = frame.push();
var t_22 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types");
if(t_22) {t_22 = runtime.fromIterator(t_22);
var t_20;
if(runtime.isArray(t_22)) {
var t_21 = t_22.length;
for(t_20=0; t_20 < t_22.length; t_20++) {
var t_23 = t_22[t_20][0];
frame.set("[object Object]", t_22[t_20][0]);
var t_24 = t_22[t_20][1];
frame.set("[object Object]", t_22[t_20][1]);
frame.set("loop.index", t_20 + 1);
frame.set("loop.index0", t_20);
frame.set("loop.revindex", t_21 - t_20);
frame.set("loop.revindex0", t_21 - t_20 - 1);
frame.set("loop.first", t_20 === 0);
frame.set("loop.last", t_20 === t_21 - 1);
frame.set("loop.length", t_21);
if(t_23 != "File") {
t_19 += "\n            <option value=\"#types_";
t_19 += runtime.suppressValue(t_23, env.opts.autoescape);
t_19 += "\">";
t_19 += runtime.suppressValue(t_23, env.opts.autoescape);
t_19 += "</option>";
;
}
;
}
} else {
t_20 = -1;
var t_21 = runtime.keys(t_22).length;
for(var t_25 in t_22) {
t_20++;
var t_26 = t_22[t_25];
frame.set("type", t_25);
frame.set("list", t_26);
frame.set("loop.index", t_20 + 1);
frame.set("loop.index0", t_20);
frame.set("loop.revindex", t_21 - t_20);
frame.set("loop.revindex0", t_21 - t_20 - 1);
frame.set("loop.first", t_20 === 0);
frame.set("loop.last", t_20 === t_21 - 1);
frame.set("loop.length", t_21);
if(t_25 != "File") {
t_19 += "\n            <option value=\"#types_";
t_19 += runtime.suppressValue(t_25, env.opts.autoescape);
t_19 += "\">";
t_19 += runtime.suppressValue(t_25, env.opts.autoescape);
t_19 += "</option>";
;
}
;
}
}
}
frame = frame.pop();
t_19 += "\n      </select>";
;
frame = callerFrame;
return new runtime.SafeString(t_19);
});
context.addExport("typeNav");
context.setVariable("typeNav", macro_t_18);
var macro_t_27 = runtime.makeMacro(
[], 
[], 
function (kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
var t_28 = "";t_28 += "\n      <div class=\"nav\">\n        <p>Browse by type of entity:</p>\n        ";
t_28 += runtime.suppressValue((lineno = 523, colno = 18, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "typeNav"), "typeNav", context, [])), env.opts.autoescape);
t_28 += "\n        <p>OR</p>";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types")),"File")) {
t_28 += "\n          <a href=\"#types_File\" class=\"find_button\">Files in this crate</a>";
;
}
t_28 += "\n        <!--";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types")),"Dataset") && runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types")),"Dataset")),"length") > 2) {
t_28 += "\n          <a href=\"#types_Dataset\">Datasets in this crate</a>";
;
}
t_28 += "\n    -->\n      </div>";
;
frame = callerFrame;
return new runtime.SafeString(t_28);
});
context.addExport("crateNav");
context.setVariable("crateNav", macro_t_27);
var macro_t_29 = runtime.makeMacro(
[], 
[], 
function (kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
var t_30 = "";if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types")),"DefinedTerm") || runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types")),"rdf:Property") || runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types")),"rdfs:Class")) {
t_30 += "\n        <h3>Custom schema elements</h3>";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types")),"rdf:Property")) {
t_30 += "\n          <a href=\"#types_rdf:Property\">Properties</a>";
;
}
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types")),"rdfs:Class")) {
t_30 += "\n          <p>|</p>\n          <a href=\"#types_rdfs:Class\">Classes</a>";
;
}
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types")),"DefinedTerm")) {
t_30 += "\n          <p>|</p>\n          <a href=\"#types_DefinedTerm\">DefinedTerms</a>";
;
}
;
}
;
frame = callerFrame;
return new runtime.SafeString(t_30);
});
context.addExport("schemaElements");
context.setVariable("schemaElements", macro_t_29);
var macro_t_31 = runtime.makeMacro(
[], 
[], 
function (kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
var t_32 = "";t_32 += "\n      <div class=\"home-link\">\n        <a href=\"#";
t_32 += runtime.suppressValue(env.getFilter("urlencode").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint")), env.opts.autoescape);
t_32 += "\" class=\"root\">\n          <svg\n            xmlns=\"http://www.w3.org/2000/svg\"\n            width=\"16\"\n            height=\"16\"\n            fill=\"currentColor\"\n            class=\"bi bi-house-door-fill\"\n            viewBox=\"0 0 16 16\"\n          >\n            <path\n              d=\"M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5\"\n            />\n          </svg>\n          Go home:\n          ";
t_32 += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint"))),"props")),"http://schema.org/name")),"fwd")),0)),"value"), env.opts.autoescape);
t_32 += "\n        </a>\n      </div>";
;
frame = callerFrame;
return new runtime.SafeString(t_32);
});
context.addExport("root");
context.setVariable("root", macro_t_31);
var macro_t_33 = runtime.makeMacro(
["type"], 
[], 
function (l_type, kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
frame.set("type", l_type);
var t_34 = "";t_34 += "\n      <!--<a href=\"#types_";
t_34 += runtime.suppressValue(l_type, env.opts.autoescape);
t_34 += "\" class=\"type\"></a>-->\n      ";
t_34 += runtime.suppressValue(env.getFilter("replace").call(context, l_type,/.*:/), env.opts.autoescape);
t_34 += "\n      ";
t_34 += runtime.suppressValue((lineno = 579, colno = 17, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "infoLink"), "infoLink", context, [runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"typeUrls")),l_type)])), env.opts.autoescape);
;
frame = callerFrame;
return new runtime.SafeString(t_34);
});
context.addExport("showType");
context.setVariable("showType", macro_t_33);
var macro_t_35 = runtime.makeMacro(
["prop"], 
[], 
function (l_prop, kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
frame.set("prop", l_prop);
var t_36 = "";if(env.getTest("string").call(context, l_prop) === true) {
t_36 += "\n        ";
t_36 += runtime.suppressValue(l_prop, env.opts.autoescape);
t_36 += "\n      ";
;
}
else {
t_36 += "\n        ";
t_36 += runtime.suppressValue(env.getFilter("merge").call(context, l_prop,{"prop": true}), env.opts.autoescape);
;
}
;
frame = callerFrame;
return new runtime.SafeString(t_36);
});
context.addExport("setProp");
context.setVariable("setProp", macro_t_35);
var macro_t_37 = runtime.makeMacro(
["item", "class"], 
[], 
function (l_item, l_class, kwargs) {
var callerFrame = frame;
frame = new runtime.Frame();
kwargs = kwargs || {};
if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {
frame.set("caller", kwargs.caller); }
frame.set("item", l_item);
frame.set("class", l_class);
var t_38 = "";t_38 += "\n      <!-- Heading Section -->\n      <div id=\"";
t_38 += runtime.suppressValue(env.getFilter("urlencode").call(context, runtime.memberLookup((l_item),"id")), env.opts.autoescape);
t_38 += "\" class=\"";
t_38 += runtime.suppressValue(l_class, env.opts.autoescape);
t_38 += "\">\n        <div class=\"entity-header-row\">\n          ";
t_38 += runtime.suppressValue((lineno = 594, colno = 18, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "root"), "root", context, [])), env.opts.autoescape);
t_38 += "\n          <h2>";
if(runtime.memberLookup((l_item),"props") && runtime.inOperator("http://schema.org/name",runtime.memberLookup((l_item),"props")) && runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((l_item),"props")),"http://schema.org/name")),"fwd")) {
t_38 += "\n              ";
t_38 += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((l_item),"props")),"http://schema.org/name")),"fwd")),0)),"value"), env.opts.autoescape);
t_38 += "\n            ";
;
}
else {
t_38 += "\n              <!-- Use ID if name isn't available, e.g. files -->\n              ";
t_38 += runtime.suppressValue(runtime.memberLookup((l_item),"id"), env.opts.autoescape);
;
}
t_38 += "\n          </h2>";
frame = frame.push();
var t_41 = runtime.memberLookup((l_item),"type");
if(t_41) {t_41 = runtime.fromIterator(t_41);
var t_40 = t_41.length;
for(var t_39=0; t_39 < t_41.length; t_39++) {
var t_42 = t_41[t_39];
frame.set("type", t_42);
frame.set("loop.index", t_39 + 1);
frame.set("loop.index0", t_39);
frame.set("loop.revindex", t_40 - t_39);
frame.set("loop.revindex0", t_40 - t_39 - 1);
frame.set("loop.first", t_39 === 0);
frame.set("loop.last", t_39 === t_40 - 1);
frame.set("loop.length", t_40);
t_38 += "\n            <span class=\"type\">";
t_38 += runtime.suppressValue((lineno = 604, colno = 42, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "showType"), "showType", context, [t_42])), env.opts.autoescape);
t_38 += "</span\n            >";
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
t_38 += "<p>|</p>";
;
}
;
}
}
frame = frame.pop();
t_38 += "\n\n          <h3>Identifier</h3>\n          <h2 class=\"id\">";
t_38 += runtime.suppressValue(runtime.memberLookup((l_item),"id"), env.opts.autoescape);
t_38 += "</h2>\n          ";
t_38 += runtime.suppressValue((lineno = 610, colno = 27, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "schemaElements"), "schemaElements", context, [])), env.opts.autoescape);
t_38 += "\n        </div>\n\n        <!-- Browse Collection section -->\n        <div class=\"section_head\">\n          <h2>Browse collection</h2>\n        </div>\n\n        <section class=\"browse\">\n          ";
t_38 += runtime.suppressValue((lineno = 619, colno = 21, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "crateNav"), "crateNav", context, [])), env.opts.autoescape);
t_38 += "\n          <!-- Think this is where the function for displaying selected item of drop down list should go but not sure -->";
if(l_item == runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint"))) {
frame = frame.push();
var t_45 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"types");
if(t_45) {t_45 = runtime.fromIterator(t_45);
var t_43;
if(runtime.isArray(t_45)) {
var t_44 = t_45.length;
for(t_43=0; t_43 < t_45.length; t_43++) {
var t_46 = t_45[t_43][0];
frame.set("[object Object]", t_45[t_43][0]);
var t_47 = t_45[t_43][1];
frame.set("[object Object]", t_45[t_43][1]);
frame.set("loop.index", t_43 + 1);
frame.set("loop.index0", t_43);
frame.set("loop.revindex", t_44 - t_43);
frame.set("loop.revindex0", t_44 - t_43 - 1);
frame.set("loop.first", t_43 === 0);
frame.set("loop.last", t_43 === t_44 - 1);
frame.set("loop.length", t_44);
t_38 += "\n              <div id=\"types_";
t_38 += runtime.suppressValue(t_46, env.opts.autoescape);
t_38 += "\" class=\"drop-down\">\n                <div class=\"entity-grid\">\n                  <h2>";
t_38 += runtime.suppressValue(t_46, env.opts.autoescape);
t_38 += " (";
t_38 += runtime.suppressValue(runtime.memberLookup((t_47),"length"), env.opts.autoescape);
t_38 += ")</h2>";
var t_48;
t_48 = runtime.memberLookup((t_47),"length") > 9;
frame.set("isLong", t_48, true);
if(frame.topLevel) {
context.setVariable("isLong", t_48);
}
if(frame.topLevel) {
context.addExport("isLong", t_48);
}
if(runtime.contextOrFrameLookup(context, frame, "isLong")) {
t_38 += "\n                    <input class=\"border\" onkeyup=\"res = search(this)\" />\n                    <span class=\"count\">\n                      (";
t_38 += runtime.suppressValue(runtime.memberLookup((t_47),"length"), env.opts.autoescape);
t_38 += " / ";
t_38 += runtime.suppressValue(runtime.memberLookup((t_47),"length"), env.opts.autoescape);
t_38 += ")</span\n                    >";
;
}
t_38 += "\n                  <div class=\"";
t_38 += runtime.suppressValue((runtime.contextOrFrameLookup(context, frame, "isLong")?"long":"short"), env.opts.autoescape);
t_38 += "\">";
frame = frame.push();
var t_51 = t_47;
if(t_51) {t_51 = runtime.fromIterator(t_51);
var t_50 = t_51.length;
for(var t_49=0; t_49 < t_51.length; t_49++) {
var t_52 = t_51[t_49];
frame.set("id", t_52);
frame.set("loop.index", t_49 + 1);
frame.set("loop.index0", t_49);
frame.set("loop.revindex", t_50 - t_49);
frame.set("loop.revindex0", t_50 - t_49 - 1);
frame.set("loop.first", t_49 === 0);
frame.set("loop.last", t_49 === t_50 - 1);
frame.set("loop.length", t_50);
if(t_52 != runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint")) {
t_38 += "\n                        <div>\n                          <a href=\"#";
t_38 += runtime.suppressValue(env.getFilter("urlencode").call(context, t_52), env.opts.autoescape);
t_38 += "\">";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),t_52)),"props")),"http://schema.org/name")),"fwd")),0)),"value")) {
t_38 += "\n                              ";
t_38 += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),t_52)),"props")),"http://schema.org/name")),"fwd")),0)),"value"), env.opts.autoescape);
;
}
else {
t_38 += "\n                              ";
t_38 += runtime.suppressValue(t_52, env.opts.autoescape);
;
}
t_38 += "\n                          </a>\n                        </div>";
;
}
;
}
}
frame = frame.pop();
t_38 += "\n                  </div>\n                </div>\n              </div>";
;
}
} else {
t_43 = -1;
var t_44 = runtime.keys(t_45).length;
for(var t_53 in t_45) {
t_43++;
var t_54 = t_45[t_53];
frame.set("type", t_53);
frame.set("list", t_54);
frame.set("loop.index", t_43 + 1);
frame.set("loop.index0", t_43);
frame.set("loop.revindex", t_44 - t_43);
frame.set("loop.revindex0", t_44 - t_43 - 1);
frame.set("loop.first", t_43 === 0);
frame.set("loop.last", t_43 === t_44 - 1);
frame.set("loop.length", t_44);
t_38 += "\n              <div id=\"types_";
t_38 += runtime.suppressValue(t_53, env.opts.autoescape);
t_38 += "\" class=\"drop-down\">\n                <div class=\"entity-grid\">\n                  <h2>";
t_38 += runtime.suppressValue(t_53, env.opts.autoescape);
t_38 += " (";
t_38 += runtime.suppressValue(runtime.memberLookup((t_54),"length"), env.opts.autoescape);
t_38 += ")</h2>";
var t_55;
t_55 = runtime.memberLookup((t_54),"length") > 9;
frame.set("isLong", t_55, true);
if(frame.topLevel) {
context.setVariable("isLong", t_55);
}
if(frame.topLevel) {
context.addExport("isLong", t_55);
}
if(runtime.contextOrFrameLookup(context, frame, "isLong")) {
t_38 += "\n                    <input class=\"border\" onkeyup=\"res = search(this)\" />\n                    <span class=\"count\">\n                      (";
t_38 += runtime.suppressValue(runtime.memberLookup((t_54),"length"), env.opts.autoescape);
t_38 += " / ";
t_38 += runtime.suppressValue(runtime.memberLookup((t_54),"length"), env.opts.autoescape);
t_38 += ")</span\n                    >";
;
}
t_38 += "\n                  <div class=\"";
t_38 += runtime.suppressValue((runtime.contextOrFrameLookup(context, frame, "isLong")?"long":"short"), env.opts.autoescape);
t_38 += "\">";
frame = frame.push();
var t_58 = t_54;
if(t_58) {t_58 = runtime.fromIterator(t_58);
var t_57 = t_58.length;
for(var t_56=0; t_56 < t_58.length; t_56++) {
var t_59 = t_58[t_56];
frame.set("id", t_59);
frame.set("loop.index", t_56 + 1);
frame.set("loop.index0", t_56);
frame.set("loop.revindex", t_57 - t_56);
frame.set("loop.revindex0", t_57 - t_56 - 1);
frame.set("loop.first", t_56 === 0);
frame.set("loop.last", t_56 === t_57 - 1);
frame.set("loop.length", t_57);
if(t_59 != runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint")) {
t_38 += "\n                        <div>\n                          <a href=\"#";
t_38 += runtime.suppressValue(env.getFilter("urlencode").call(context, t_59), env.opts.autoescape);
t_38 += "\">";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),t_59)),"props")),"http://schema.org/name")),"fwd")),0)),"value")) {
t_38 += "\n                              ";
t_38 += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),t_59)),"props")),"http://schema.org/name")),"fwd")),0)),"value"), env.opts.autoescape);
;
}
else {
t_38 += "\n                              ";
t_38 += runtime.suppressValue(t_59, env.opts.autoescape);
;
}
t_38 += "\n                          </a>\n                        </div>";
;
}
;
}
}
frame = frame.pop();
t_38 += "\n                  </div>\n                </div>\n              </div>";
;
}
}
}
frame = frame.pop();
;
}
t_38 += "\n        </section>\n\n        <!--Section for files if they are avails-->";
var t_60;
t_60 = /(\.txt)$|(\.html?)$/i;
frame.set("htmlRegex", t_60, true);
if(frame.topLevel) {
context.setVariable("htmlRegex", t_60);
}
if(frame.topLevel) {
context.addExport("htmlRegex", t_60);
}
var t_61;
t_61 = /\.md$/i;
frame.set("mdRegex", t_61, true);
if(frame.topLevel) {
context.setVariable("mdRegex", t_61);
}
if(frame.topLevel) {
context.addExport("mdRegex", t_61);
}
var t_62;
t_62 = /(\.mp3)|(\.ogg?)|(\.wav)$/i;
frame.set("audioRegex", t_62, true);
if(frame.topLevel) {
context.setVariable("audioRegex", t_62);
}
if(frame.topLevel) {
context.addExport("audioRegex", t_62);
}
var t_63;
t_63 = /(\.jpe?g)|(\.png|(\.giff?))$/i;
frame.set("imgRegex", t_63, true);
if(frame.topLevel) {
context.setVariable("imgRegex", t_63);
}
if(frame.topLevel) {
context.addExport("imgRegex", t_63);
}
var t_64;
t_64 = /(\.mp4)|(\.mov)$/i;
frame.set("vidRegex", t_64, true);
if(frame.topLevel) {
context.setVariable("vidRegex", t_64);
}
if(frame.topLevel) {
context.addExport("vidRegex", t_64);
}
var t_65;
t_65 = /pdf$/i;
frame.set("pdfRegex", t_65, true);
if(frame.topLevel) {
context.setVariable("pdfRegex", t_65);
}
if(frame.topLevel) {
context.addExport("pdfRegex", t_65);
}
if((lineno = 664, colno = 33, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((l_item),"type")),"includes"), "item[\"type\"][\"includes\"]", context, ["File"]))) {
t_38 += "\n          <div class=\"centered-files\">";
if((lineno = 666, colno = 33, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "htmlRegex")),"test"), "htmlRegex[\"test\"]", context, [runtime.memberLookup((l_item),"id")]))) {
t_38 += "\n              <!-- TODO: fix these width=\"80%\"s, they are not valid -->\n              <iframe\n                src=\"";
t_38 += runtime.suppressValue(runtime.memberLookup((l_item),"id"), env.opts.autoescape);
t_38 += "\"\n                type=\"text/plain\"\n                width=\"80%\"\n                height=\"500\"\n                loading=\"lazy\"\n              ></iframe>\n            ";
;
}
else {
if((lineno = 675, colno = 35, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "audioRegex")),"test"), "audioRegex[\"test\"]", context, [runtime.memberLookup((l_item),"id")]))) {
t_38 += "\n              <audio controls width=\"80%\">\n                <source src=\"";
t_38 += runtime.suppressValue(runtime.memberLookup((l_item),"id"), env.opts.autoescape);
t_38 += "\" />\n              </audio>\n            ";
;
}
else {
if((lineno = 679, colno = 33, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "vidRegex")),"test"), "vidRegex[\"test\"]", context, [runtime.memberLookup((l_item),"id")]))) {
t_38 += "\n              <video io controls>\n                <source src=\"";
t_38 += runtime.suppressValue(runtime.memberLookup((l_item),"id"), env.opts.autoescape);
t_38 += "\" />\n              </video>\n            ";
;
}
else {
if((lineno = 683, colno = 33, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "imgRegex")),"test"), "imgRegex[\"test\"]", context, [runtime.memberLookup((l_item),"id")]))) {
t_38 += "\n              <img\n                width=\"80%\"\n                style=\"object-fit: contain\"\n                src=\"";
t_38 += runtime.suppressValue(runtime.memberLookup((l_item),"id"), env.opts.autoescape);
t_38 += "\"\n                loading=\"lazy\"\n              />\n            ";
;
}
else {
if((lineno = 690, colno = 32, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "mdRegex")),"test"), "mdRegex[\"test\"]", context, [runtime.memberLookup((l_item),"id")]))) {
if(runtime.memberLookup((l_item),"content")) {
t_38 += "\n                ";
t_38 += runtime.suppressValue(env.getFilter("safe").call(context, env.getFilter("renderMarkdown").call(context, runtime.memberLookup((l_item),"content"))), env.opts.autoescape);
;
}
else {
t_38 += "\n                <p>Markdown content not available. <a href=\"";
t_38 += runtime.suppressValue(env.getFilter("urlencode").call(context, runtime.memberLookup((l_item),"id")), env.opts.autoescape);
t_38 += "\">View file</a></p>";
;
}
t_38 += "\n            ";
;
}
else {
if((lineno = 696, colno = 33, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "pdfRegex")),"test"), "pdfRegex[\"test\"]", context, [runtime.memberLookup((l_item),"id")]))) {
t_38 += "\n              <!--          <iframe   src=\"";
t_38 += runtime.suppressValue(runtime.memberLookup((l_item),"id"), env.opts.autoescape);
t_38 += "\" type=\"application/pdf\" width=\"100%\" height=\"600px\" loading=\"lazy\" />-->";
;
}
;
}
;
}
;
}
;
}
;
}
t_38 += "\n            <a href=\"";
t_38 += runtime.suppressValue(env.getFilter("urlencode").call(context, runtime.memberLookup((l_item),"id")), env.opts.autoescape);
t_38 += "\">Open file location</a>\n          </div>";
;
}
t_38 += "\n\n        <!-- Properties section -->\n        <div class=\"section_head\">\n          <h2>Details</h2>\n        </div>\n\n        <div class=\"property-grid\">";
var t_66;
t_66 = {"@id": true,"@type": true};
frame.set("seenProps", t_66, true);
if(frame.topLevel) {
context.setVariable("seenProps", t_66);
}
if(frame.topLevel) {
context.addExport("seenProps", t_66);
}
frame = frame.push();
var t_69 = runtime.contextOrFrameLookup(context, frame, "layout");
if(t_69) {t_69 = runtime.fromIterator(t_69);
var t_68 = t_69.length;
for(var t_67=0; t_67 < t_69.length; t_67++) {
var t_70 = t_69[t_67];
frame.set("group", t_70);
frame.set("loop.index", t_67 + 1);
frame.set("loop.index0", t_67);
frame.set("loop.revindex", t_68 - t_67);
frame.set("loop.revindex0", t_68 - t_67 - 1);
frame.set("loop.first", t_67 === 0);
frame.set("loop.last", t_67 === t_68 - 1);
frame.set("loop.length", t_68);
var t_71;
t_71 = false;
frame.set("hasContent", t_71, true);
if(frame.topLevel) {
context.setVariable("hasContent", t_71);
}
if(frame.topLevel) {
context.addExport("hasContent", t_71);
}
frame = frame.push();
var t_74 = runtime.memberLookup((t_70),"inputs");
if(t_74) {t_74 = runtime.fromIterator(t_74);
var t_73 = t_74.length;
for(var t_72=0; t_72 < t_74.length; t_72++) {
var t_75 = t_74[t_72];
frame.set("input", t_75);
frame.set("loop.index", t_72 + 1);
frame.set("loop.index0", t_72);
frame.set("loop.revindex", t_73 - t_72);
frame.set("loop.revindex0", t_73 - t_72 - 1);
frame.set("loop.first", t_72 === 0);
frame.set("loop.last", t_72 === t_73 - 1);
frame.set("loop.length", t_73);
if(runtime.memberLookup((runtime.memberLookup((l_item),"props")),t_75)) {
var t_76;
t_76 = true;
frame.set("hasContent", t_76, true);
if(frame.topLevel) {
context.setVariable("hasContent", t_76);
}
if(frame.topLevel) {
context.addExport("hasContent", t_76);
}
var t_77;
t_77 = env.getFilter("setProp").call(context, runtime.contextOrFrameLookup(context, frame, "seenProps"),t_75);
frame.set("seenProps", t_77, true);
if(frame.topLevel) {
context.setVariable("seenProps", t_77);
}
if(frame.topLevel) {
context.addExport("seenProps", t_77);
}
;
}
;
}
}
frame = frame.pop();
if(runtime.contextOrFrameLookup(context, frame, "hasContent")) {
t_38 += "\n              <div class=\"property-header-row\">";
t_38 += runtime.suppressValue(runtime.memberLookup((t_70),"name"), env.opts.autoescape);
t_38 += "</div>";
;
}
frame = frame.push();
var t_80 = runtime.memberLookup((t_70),"inputs");
if(t_80) {t_80 = runtime.fromIterator(t_80);
var t_79 = t_80.length;
for(var t_78=0; t_78 < t_80.length; t_78++) {
var t_81 = t_80[t_78];
frame.set("input", t_81);
frame.set("loop.index", t_78 + 1);
frame.set("loop.index0", t_78);
frame.set("loop.revindex", t_79 - t_78);
frame.set("loop.revindex0", t_79 - t_78 - 1);
frame.set("loop.first", t_78 === 0);
frame.set("loop.last", t_78 === t_79 - 1);
frame.set("loop.length", t_79);
if(runtime.memberLookup((runtime.memberLookup((l_item),"props")),t_81)) {
t_38 += "\n                ";
t_38 += runtime.suppressValue((lineno = 723, colno = 30, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "displayProp"), "displayProp", context, [t_81,runtime.memberLookup((runtime.memberLookup((l_item),"props")),t_81)])), env.opts.autoescape);
;
}
;
}
}
frame = frame.pop();
;
}
}
frame = frame.pop();
var t_82;
t_82 = false;
frame.set("hasContent", t_82, true);
if(frame.topLevel) {
context.setVariable("hasContent", t_82);
}
if(frame.topLevel) {
context.addExport("hasContent", t_82);
}
frame = frame.push();
var t_85 = runtime.memberLookup((l_item),"props");
if(t_85) {t_85 = runtime.fromIterator(t_85);
var t_83;
if(runtime.isArray(t_85)) {
var t_84 = t_85.length;
for(t_83=0; t_83 < t_85.length; t_83++) {
var t_86 = t_85[t_83][0];
frame.set("[object Object]", t_85[t_83][0]);
var t_87 = t_85[t_83][1];
frame.set("[object Object]", t_85[t_83][1]);
frame.set("loop.index", t_83 + 1);
frame.set("loop.index0", t_83);
frame.set("loop.revindex", t_84 - t_83);
frame.set("loop.revindex0", t_84 - t_83 - 1);
frame.set("loop.first", t_83 === 0);
frame.set("loop.last", t_83 === t_84 - 1);
frame.set("loop.length", t_84);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "seenProps")),t_86)) {
var t_88;
t_88 = true;
frame.set("hasContent", t_88, true);
if(frame.topLevel) {
context.setVariable("hasContent", t_88);
}
if(frame.topLevel) {
context.addExport("hasContent", t_88);
}
;
}
;
}
} else {
t_83 = -1;
var t_84 = runtime.keys(t_85).length;
for(var t_89 in t_85) {
t_83++;
var t_90 = t_85[t_89];
frame.set("input", t_89);
frame.set("val", t_90);
frame.set("loop.index", t_83 + 1);
frame.set("loop.index0", t_83);
frame.set("loop.revindex", t_84 - t_83);
frame.set("loop.revindex0", t_84 - t_83 - 1);
frame.set("loop.first", t_83 === 0);
frame.set("loop.last", t_83 === t_84 - 1);
frame.set("loop.length", t_84);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "seenProps")),t_89)) {
var t_91;
t_91 = true;
frame.set("hasContent", t_91, true);
if(frame.topLevel) {
context.setVariable("hasContent", t_91);
}
if(frame.topLevel) {
context.addExport("hasContent", t_91);
}
;
}
;
}
}
}
frame = frame.pop();
if(runtime.contextOrFrameLookup(context, frame, "hasContent")) {
t_38 += "\n            <div class=\"property-header-row\">Other properties</div>";
;
}
frame = frame.push();
var t_94 = runtime.memberLookup((l_item),"props");
if(t_94) {t_94 = runtime.fromIterator(t_94);
var t_92;
if(runtime.isArray(t_94)) {
var t_93 = t_94.length;
for(t_92=0; t_92 < t_94.length; t_92++) {
var t_95 = t_94[t_92][0];
frame.set("[object Object]", t_94[t_92][0]);
var t_96 = t_94[t_92][1];
frame.set("[object Object]", t_94[t_92][1]);
frame.set("loop.index", t_92 + 1);
frame.set("loop.index0", t_92);
frame.set("loop.revindex", t_93 - t_92);
frame.set("loop.revindex0", t_93 - t_92 - 1);
frame.set("loop.first", t_92 === 0);
frame.set("loop.last", t_92 === t_93 - 1);
frame.set("loop.length", t_93);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "seenProps")),t_95)) {
t_38 += "\n              ";
t_38 += runtime.suppressValue((lineno = 741, colno = 28, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "displayProp"), "displayProp", context, [t_95,runtime.memberLookup((runtime.memberLookup((l_item),"props")),t_95)])), env.opts.autoescape);
;
}
;
}
} else {
t_92 = -1;
var t_93 = runtime.keys(t_94).length;
for(var t_97 in t_94) {
t_92++;
var t_98 = t_94[t_97];
frame.set("input", t_97);
frame.set("val", t_98);
frame.set("loop.index", t_92 + 1);
frame.set("loop.index0", t_92);
frame.set("loop.revindex", t_93 - t_92);
frame.set("loop.revindex0", t_93 - t_92 - 1);
frame.set("loop.first", t_92 === 0);
frame.set("loop.last", t_92 === t_93 - 1);
frame.set("loop.length", t_93);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "seenProps")),t_97)) {
t_38 += "\n              ";
t_38 += runtime.suppressValue((lineno = 741, colno = 28, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "displayProp"), "displayProp", context, [t_97,runtime.memberLookup((runtime.memberLookup((l_item),"props")),t_97)])), env.opts.autoescape);
;
}
;
}
}
}
frame = frame.pop();
t_38 += "\n        </div>\n      </div>";
;
frame = callerFrame;
return new runtime.SafeString(t_38);
});
context.addExport("display");
context.setVariable("display", macro_t_37);
output += "\n\n    ";
output += runtime.suppressValue((lineno = 748, colno = 14, runtime.callWrap(macro_t_37, "display", context, [runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids")),runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint")),"root"])), env.opts.autoescape);
frame = frame.push();
var t_101 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"ids");
if(t_101) {t_101 = runtime.fromIterator(t_101);
var t_99;
if(runtime.isArray(t_101)) {
var t_100 = t_101.length;
for(t_99=0; t_99 < t_101.length; t_99++) {
var t_102 = t_101[t_99][0];
frame.set("[object Object]", t_101[t_99][0]);
var t_103 = t_101[t_99][1];
frame.set("[object Object]", t_101[t_99][1]);
frame.set("loop.index", t_99 + 1);
frame.set("loop.index0", t_99);
frame.set("loop.revindex", t_100 - t_99);
frame.set("loop.revindex0", t_100 - t_99 - 1);
frame.set("loop.first", t_99 === 0);
frame.set("loop.last", t_99 === t_100 - 1);
frame.set("loop.length", t_100);
if(t_102 != runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint")) {
output += "\n        ";
output += runtime.suppressValue((lineno = 752, colno = 18, runtime.callWrap(macro_t_37, "display", context, [t_103,"entity"])), env.opts.autoescape);
;
}
;
}
} else {
t_99 = -1;
var t_100 = runtime.keys(t_101).length;
for(var t_104 in t_101) {
t_99++;
var t_105 = t_101[t_104];
frame.set("id", t_104);
frame.set("entity", t_105);
frame.set("loop.index", t_99 + 1);
frame.set("loop.index0", t_99);
frame.set("loop.revindex", t_100 - t_99);
frame.set("loop.revindex0", t_100 - t_99 - 1);
frame.set("loop.first", t_99 === 0);
frame.set("loop.last", t_99 === t_100 - 1);
frame.set("loop.length", t_100);
if(t_104 != runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "data")),"entryPoint")) {
output += "\n        ";
output += runtime.suppressValue((lineno = 752, colno = 18, runtime.callWrap(macro_t_37, "display", context, [t_105,"entity"])), env.opts.autoescape);
;
}
;
}
}
}
frame = frame.pop();
output += "\n  </body>\n</html>\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};
 })()};
