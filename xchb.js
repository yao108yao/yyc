// ==UserScript==
// @icon http://pic.c-ctrip.com/common/c_logo2013.png
// @name            携程航班
// @author          yao
// @description     下载携程航班数据
// @include         http*://flights.ctrip.com/schedule/*-*map.html
// @require         http://cdn.bootcss.com/jquery/1.8.3/jquery.min.js
// @version         1.0.0
// @grant           none
// ==/UserScript==

//定义全局变量，用于存储每个页面采集到的航班数据，是一个逗号分隔的字符串变量
var finalData;


//写数据，该函数用于生成下载链接，在downloadData最后调用
function writeData(resultData) {
    //创建 <a>元素
    var downloadLink = document.createElement('a');
    //获取航班标题信息
    var titleName = $('.tab_title.clearfix>.current a')[0].text;
    //下载文件的默认文件名
    downloadLink.download = titleName + '.csv';
    //downloadLink.style.display = 'none';
    // "\ufeff" 使编码为utf-8-bom，避免乱码
    var strData = "\ufeff" + "航线名,起飞,到达,起飞机场,到达机场,航空公司,航班号,\r" + resultData;
    //将字符串数据转化为可供下载的文件
    var blobFile = new Blob([strData], { type: 'text/csv,charset=UTF-8' });
    //根据创建的文件生成下载链接，写入a元素的超链接中
    downloadLink.href = (window.URL || window.webkitURL).createObjectURL(blobFile);
    //追加下载链接元素
    document.body.appendChild(downloadLink);
    //点击下载链接元素
    downloadLink.click();
    //移除下载链接
    document.body.removeChild(downloadLink);
}


////生成下载按钮，将按钮添加到航班时刻信息标题栏
function downloadButton() {
    var a = `<a href="javascript:;" id="downloadData" 
              style="margin-left:100px;color:red;font-size:20px">下载</a> `;
    $('.mod_box h3:first').append(a);
}


//下载数据:先获取数据，再写入数据，此函数绑定到下载按钮上，点击按钮时即运行
function downloadData() {
    var newWindow;
    var nextPage;
    var newURL;

    //获取第1页数据
    finalData = GetData(this.document);

    //取得下一页
    nextPage = $(".schedule_down")[0];

    if (nextPage) {
        //原始nextPage.href 是 http,主页面是 https，需要进行替换
        newURL = nextPage.href.replace(/http/, "https");
        //弹出打开新窗口   , "FilghtWindow", "directories=no,resizable=no, width=400, height=400"
        newWindow = window.open(newURL, 'FilghtWindow', "directories=no,resizable=no, width=400, height=400");
        newWindow.focus();

        function winLoaded() {
            //添加当窗口页面刷新前（即退出）的事件
            this.onunload = winUnloaded;
            //获取其余页数据
            finalData = finalData + GetData(this.document);

            //获取下一页链接元素
            nextPage = $('.schedule_down', this.document)[0];
            if (nextPage) {
                //console.log('window.onload#######'+newWindow.onload);
                //弹出窗口中打开新页面
                nextPage.click();
            } else {
                //console.log(finalData);  
                //有多页数据时，会调用此处写入
                writeData(finalData);
                this.close();

            }

        }

        //绑定于新窗口的onunload事件，该事件在onload中添加到新窗口
        function winUnloaded() {
            //必须要延时，否则当前页面示完全退出，会将事件挂载到当前页面，新页面挂载无效
            setTimeout(function () {
                newWindow.onload = winLoaded;
            }, 0);
        }

        //为弹出的新窗口添加onload事件
        newWindow.onload = winLoaded;


    } else {
        //只有单页数据时，调用此处写入
        writeData(finalData);
    }
}


//从页面获取数据,生成csv字符串，此函数在downloadData按钮点击事件中调用
function GetData(docData) {
    //tbRows为表格包含所有tr行的数组
    var tbRows = $(".fltlist_table > tbody > tr", docData);
    //定义表格行数
    var rowCount;

    if (!tbRows && typeof (tbRows) != "undefined" && tbRows != 0) {
        alert("找不到表格: fltlist_table");
        return;
    }

    rowCount = tbRows.length;
    //console.log(rowCount);

    //将表格中的数据连接为csv逗号分隔的字符串，每行末尾插入换行符
    var strTmp = "";
    var strData = "";
    for (var i = 0; i < rowCount; i++) {

        strData += tbRows[i].cells[0].innerText + ',';

        strTmp = tbRows[i].cells[1].innerText;
        strData += strTmp.replace(/[\n\r]/g, ',') + ',';

        strTmp = tbRows[i].cells[2].innerText;
        strData += strTmp.replace(/[\n\r]/g, ',') + ',';

        strTmp = tbRows[i].cells[6].innerText;
        strData += strTmp.replace(/[\n\r]/g, ',') + ',';

        strData += "\r"
    }

    return strData;
}


$(function () {
    //添加下载按钮到页面
    downloadButton();

    //对按钮添加点击事件
    $("#downloadData").click(function () { downloadData() });

});
