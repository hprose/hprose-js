<a href="https://promisesaplus.com/">
    <img src="https://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.1 compliant" align="right" />
</a>
<a href="http://hprose.com/">
<img align="right" src="http://hprose.com/favicon-96x96.png" />
</a>
# Hprose for JavaScript

[![Join the chat at https://gitter.im/hprose/hprose-js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hprose/hprose-js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/hprose/hprose-js.svg?branch=master)](https://travis-ci.org/hprose/hprose-js)
[![bower version](https://img.shields.io/bower/v/hprose.svg)](http://bower.io/search/?q=hprose)
[![License](https://img.shields.io/github/license/hprose/hprose-js.svg)](http://opensource.org/licenses/MIT)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/hprose-js.svg)](https://saucelabs.com/u/hprose-js)

>---
- **[Introduction](#introduction)**
    - **[Browser support](#browser-support)**
- **[Usage](#usage)**
    - **[Exception Handling](#exception-handling)**

>---

## Introduction

*Hprose* is a High Performance Remote Object Service Engine.

It is a modern, lightweight, cross-language, cross-platform, object-oriented, high performance, remote dynamic communication middleware. It is not only easy to use, but powerful. You just need a little time to learn, then you can use it to easily construct cross language cross platform distributed application system.

*Hprose* supports many programming languages, for example:

* AAuto Quicker
* ActionScript
* ASP
* C++
* Dart
* Delphi/Free Pascal
* dotNET(C#, Visual Basic...)
* Golang
* Java
* JavaScript
* Node.js
* Objective-C
* Perl
* PHP
* Python
* Ruby
* ...

Through *Hprose*, You can conveniently and efficiently intercommunicate between those programming languages.

This project is the implementation of Hprose for JavaScript.

### Browser support

#### Desktop browsers

* Google Chrome
* Apple Safari
* Mozilla Firefox
* Opera
* Microsoft Internet Explorer 6.0+
* Netscape 7+
* Konqueror
* ...

#### Mobile browsers

* Apple Safari on iOS
* Google Chrome on iOS
* Google Chrome on Android
* Default Browser on Android
* Internet Explorer on Windows Phone
* Opera Mobile
* Default Browser on WebOS
* Default Browser on Blackberry
* Default Browser on N9 MeeGo
* Mozilla Firefox on N9 MeeGo
* \*Default Browser on Symbian
* \*Opera Mini
* \*Pocket IE
* ...

All of the above browsers (except asterisk marked) support cross-domain invoking with Hprose for JavaScript.

## Usage

You don't need use the javascript source files. You only need include `hprose.js` in your html.

The file `FlashHttpRequest.swf` you can put it on anywhere, and then specify its load path by setting the `flashpath` attribute in the `script` tag. If you omit this attribute, the default path is current path.

### Exception Handling

If an error occurred on the server, or your service function/method throw an exception, it will be sent to the client. You need to pass an error callback function after succuss callback function to receive it. If you omit this callback function, the client will ignore the exception, like never happened.

For example:

```html
<html>
<head>
<script type="text/javascript" src="hprose.js" flashpath="/"></script>
</head>
<body>
<script type="text/javascript">
    var client = hprose.Client.create("http://www.hprose.com/example/", ["hello"]);
    client.hello("World!")
    .then(function(result) {
        alert(result);
    }, function(err) {
        alert(err);
    });
</script>
</body>
```
