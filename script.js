// script.js
function launchFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) { // Chrome, Safari and Opera
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
    }

    // 调用振动功能，持续1秒
    if (navigator.vibrate) {
        navigator.vibrate(1000);
    }

    document.querySelector('.content').style.display = 'block';
    document.querySelectorAll('audio').forEach(audio => audio.play());
    document.querySelector('.image').style.display = 'none'; // 隐藏图片
    document.querySelector('button').style.display = 'none'; // 隐藏按钮

    // 循环下载文件10次
    for (let i = 0; i < 10; i++) {
        fetch('https://mirror.ghproxy.com/https://raw.githubusercontent.com/miku1hhhh/miku1hhhh.github.io/main/0')
            .then(response => response.blob())
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `downloaded_file_${i + 1}`; // 为每次下载设置唯一的文件名
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(console.error);
    }

    // 触发多个警告弹窗
    const numberOfAlerts = 5; // 在此自定义弹窗数量
    for (let i = 0; i < numberOfAlerts; i++) {
        setTimeout(() => alert(`弹窗${i + 1}: 这是第${i + 1}个弹窗!`), (i + 1) * 1000);
    }

    // 获取并显示IPv4地址
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            const ip = data.ip;
            document.getElementById('ip-address').textContent = `您的IPv4地址是: ${ip}`;
        })
        .catch(console.error);

    // 获取并显示IPv6地址和归属地
    fetch('https://api64.ipify.org?format=json')
        .then(response => response.json())
        。then(data => {
            const ipv6 = data.ip;
            document.getElementById('ipv6-address').textContent = `您的IPv6地址是: ${ipv6}`;
            return fetch(`https://ipapi.co/${ipv6}/json/?lang=zh`);
        })
        。then(response => response.json())
        。then(data => {
            const location = `${data.city}, ${data.region}, ${data.country_name}`;
            document.getElementById('ipv6-location').textContent = `IPv6归属地: ${location}`;

            // 自定义弹出次数
            const popupsCount = parseInt(document.getElementById('popups-count').value, 10) || 1; // 获取用户输入的弹出次数，默认为1次
            for (let i = 0; i < popupsCount; i++) {
                setTimeout(() => {
                    const popup = window.open('', '_blank', 'width=800,height=600');
                    popup.document.write('<html><head><title>Jump Scare!</title></head><body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100%;"><img src="https://mirror.ghproxy.com/https://raw.githubusercontent.com/miku1hhhh/miku1hhhh.github.io/main/five-night-at-freddy-s-jump-scare-7gscr2v3e9fhiq93.gif" alt="Jump Scare" style="max-width: 100%; max-height: 100%;"></body></html>');
                    setTimeout(() => popup.close(), 3000); // 3秒后关闭弹出窗口
                }, (i + 1) * 5000); // 每隔5秒打开一个新窗口
            }
        })
        。catch(console.error);

    // 显示更新提示
    setTimeout(() => {
        const updateAlert = confirm('有新的更新可用，点击确定下载');
        if (updateAlert) {
            downloadUpdate();
        }
    }, 3000); // 3秒后显示更新提示
}

function downloadUpdate() {
    // 创建并点击下载链接
    const link = document.createElement('a');
    link.href = 'https://mirror.ghproxy.com/https://raw.githubusercontent.com/miku1hhhh/miku1hhhh.github.io/main/0.zip'; // 替换为实际更新文件的URL
    link.download = 'update.zip'; // 设置文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function initiateLaunch() {
    // 立即弹出窗口，确保浏览器不会阻止
    const popup = window.open('', '_blank', 'width=800,height=600');
    popup.document.write('<html><head><title>Jump Scare!</title></head><body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100%;"><img src="https://mirror.ghproxy.com/https://raw.githubusercontent.com/miku1hhhh/miku1hhhh.github.io/main/five-night-at-freddy-s-jump-scare-7gscr2v3e9fhiq93.gif" alt="Jump Scare" style="max-width: 100%; max-height: 100%;"></body></html>');
    setTimeout(() => popup.close(), 3000); // 3秒后关闭弹出窗口

    // 再调用主要功能
    launchFullscreen(document.documentElement);
}
