// 生成随机Id
const randomId = () => {
    return Math.random().toString(36).substring(2);
}

// 地图坐标类
class MapPointerImg {
    constructor(startX, startY, endX, endY, imgUrl) {
        this.startX = startX || 0;
        this.startY = startY || 0;
        this.endX = endX || 0;
        this.endY = endY || 0;
        this.imgUrl = imgUrl || '';
        this.imgFile = null;
        this.id = randomId();
    }

    get width() {
        return this.endX - this.startX;
    }

    get height() {
        return this.endY - this.startY;
    }
}



export default class Draw {
    /**
     * 
     * @param { HTMLElement } drawDom 放置canvas元素的dom
     * @param { String } imgUrl 图片路径
     * @param { Number } maxLength 最大画框数量 0 不限制
     */
    constructor(drawDom, imgUrl, maxLength = 0) {
        this.drawDom = drawDom;
        const canvasDom = document.createElement('canvas');
        this.canvasDom = canvasDom;
        this.drawDom.appendChild(canvasDom);
        this.ctx = canvasDom.getContext('2d');
        this.mapList = [];
        this.imgUrl = imgUrl;
        this.mapPointer = new MapPointerImg();
        this.imgDom = null;
        this.maxLength = maxLength;
        this.eventMap = new Map();

        this.init();
    }



    init() {
        this.drawImg();
        this.registeredEvents();
    }

    drawImg() {
        const img = new Image();
        img.addEventListener('load', () => {
            const { width, height } = img;
            this.canvasDom.width = width;
            this.canvasDom.height = height;
            this.drawDom.style.width = width + 'px';
            this.drawDom.style.height = height + 'px';
            this.drawDom.style.backgroundImage = `url(${this.imgUrl})`;
            this.drawDom.style.backgroundRepeat = 'no-repeat';
        })
        img.src = this.imgUrl;
        this.imgDom = img
    }

    // 绘制描边矩形
    drawStrokeRect(mouseX, mouseY) {
        const { startX, startY } = this.mapPointer;
        const { ctx, canvasDom } = this;
        // 清空Canvas并实时绘制矩形描边
        ctx.clearRect(0, 0, canvasDom.width, canvasDom.height);
        // 实时绘制之前的map数据
        this.mapList.forEach(pointer => {
            ctx.beginPath();
            ctx.strokeRect(pointer.startX, pointer.startY, pointer.endX - pointer.startX, pointer.endY - pointer.startY);
            ctx.stroke();
        })
        ctx.beginPath();
        ctx.strokeRect(startX, startY, mouseX - startX, mouseY - startY);
        ctx.stroke();
    }

    // 根据坐标点截取图片
    cutImg() {
        const { startX, startY, endX, endY } = this.mapPointer;
        const canvas = this.canvasDom.cloneNode();
        const width = endX - startX;
        const height = endY - startY;
        canvas.width = width;
        canvas.height = height;
        // 绘制图片
        if (!this.imgDom) return;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.imgDom, startX, startY, width, height, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/png");
        const blob = new Blob([base64], { type: 'image/png' });
        const file = new File([blob], `${this.mapPointer.id}.png`, { type: 'image/png' });
        this.mapPointer.imgUrl = base64;
        this.mapPointer.imgFile = file;
        document.body.appendChild(canvas);
    }

    /**
     * 
     * @type {'limet'} key  
     * @param {Function} fun 
     */

    addEventListener(key, fun) {
        const { eventMap } = this;
        const eventList = eventMap.get(key);
        if (eventList) {
            eventList.push(fun);
        } else {
            const data = [fun];
            eventMap.set(key, data);
        }
    }

    /**
     * 
     * @type {'limet'} key  
     * @param {Function} fun 
     */
    removeEventListener(key, fun) {
        const { eventMap } = this;
        const eventList = eventMap.get(key);
        if (eventList) {
            eventList.splice(eventList.indexOf(fun), 1);
        }
    }

    runEventListener() {
        const { eventMap } = this;
        eventMap.forEach(eventList => {
            eventList.forEach(fun => fun())
        })
    }


    registeredEvents() {

        const docMove = (e) => {
            // 计算移动时的坐标
            const { left, top, width, height } = this.canvasDom.getBoundingClientRect();
            let mouseX = e.clientX - left;
            let mouseY = e.clientY - top;
            // 鼠标超出了canvas范围
            if (mouseX < 0) {
                mouseX = 0;
            }
            if (mouseX > width) {
                mouseX = width
            }
            if (mouseY < 0) {
                mouseY = 0;
            }
            if (mouseY > height) {
                mouseY = height;
            }
            this.mapPointer.endX = mouseX;
            this.mapPointer.endY = mouseY;
            this.drawStrokeRect(mouseX, mouseY);
        }

        const docUp = () => {

            // 当endX，endY 小于 startX，startY则交换位置
            if (this.mapPointer.endX < this.mapPointer.startX) {
                [this.mapPointer.startX, this.mapPointer.endX] = [this.mapPointer.endX, this.mapPointer.startX];
            }
            if (this.mapPointer.endY < this.mapPointer.startY) {
                [this.mapPointer.startY, this.mapPointer.endY] = [this.mapPointer.endY, this.mapPointer.startY];
            }


            this.cutImg();
            // 当前作画的信息
            this.mapList.push({
                ...this.mapPointer
            })
            document.removeEventListener('mousemove', docMove);
            document.removeEventListener('mouseup', docUp);
        }

        const docDown = (e) => {
            if (this.maxLength !== 0 && this.mapList.length >= this.maxLength) {
                this.runEventListener();
                document.removeEventListener('mousedown', docDown)
                return
            }
            // 记录按下坐标
            const { left, top } = this.canvasDom.getBoundingClientRect();
            const startX = e.clientX - left;
            const startY = e.clientY - top;
            this.mapPointer.startX = startX
            this.mapPointer.startY = startY;

            document.addEventListener('mousemove', docMove)
            document.addEventListener('mouseup', docUp)
        }


        this.canvasDom.addEventListener('mousedown', docDown)
    }
}