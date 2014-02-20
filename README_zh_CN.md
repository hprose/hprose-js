# Hprose for JavaScript

>---
- **[简介](#简介)**
    - **[浏览器支持](#浏览器支持)**
- **[使用](#使用)**
    - **[异常处理](#异常处理)**

>---

## 简介

*Hprose* 是高性能远程对象服务引擎（High Performance Remote Object Service Engine）的缩写。

它是一个先进的轻量级的跨语言跨平台面向对象的高性能远程动态通讯中间件。它不仅简单易用，而且功能强大。你只需要稍许的时间去学习，就能用它轻松构建跨语言跨平台的分布式应用系统了。

*Hprose* 支持众多编程语言，例如：

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

通过 *Hprose*，你就可以在这些语言之间方便高效的实现互通了。

本项目是 Hprose 的 JavaScript 语言版本实现。

### 浏览器支持

#### 桌面浏览器

* Google Chrome
* Apple Safari
* Mozilla Firefox
* Opera
* Microsoft Internet Explorer 6.0+
* Netscape 7+
* Konqueror
* ...

#### 移动浏览器

* iOS 上的 Apple Safari
* iOS 上的 Google Chrome
* Android 上的 Google Chrome
* Android 的默认浏览器
* Windows Phone 上的 Internet Explorer
* WebOS 的默认浏览器
* Blackberry 的默认浏览器
* N9 MeeGo 的默认浏览器
* N9 MeeGo 上的 Mozilla Firefox
* \*Symbian^3 的默认浏览器
* Opera Mobile
* \*Opera Mini
* \*Pocket IE
* ...

以上所有浏览器（除了加星号标注的），使用 Hprose for JavaScript 均支持跨域调用。

## 使用

你不需要使用 javascript 的源文件，你只需要在你的 html 中包含 `hprose.js` 就够了。

你可以将文件 `hproseHttpRequest.swf` 放在任何地方, 然后通过在 `script` 标签上设置 `flashpath` 属性来指定它的加载路径就行了。如果你忽略该属性，默认路径是当前路径。

### 异常处理

如果服务器端发生错误，或者你的服务函数或方法抛出了异常，它将被发送到客户端。你可以在成功回调函数后面传入错误回调函数来接收它。如果你忽略该回调函数，客户端将忽略该异常，就像从来没发生过一样。

例如：

```html
<html>
<head>
<script type="text/javascript" src="hprose.js" flashpath="/"></script>
</head>
<body>
<script type="text/javascript">
    var client = new HproseHttpClient("http://www.hprose.com/example/", ["hello"]);
    client.hello("World!", function(result) {
        alert(result);
    }, function(name, err) {
        alert(err);
    });
</script>
</body>
```
