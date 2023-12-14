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

    // 给一个坐标点 判断坐标点是否在当前区域
    static isInArea(x, y, mapPointer) {
        return x >= mapPointer.startX && x <= mapPointer.endX && y >= mapPointer.startY && y <= mapPointer.endY;
    }

}

// 设置鼠标样式
const setCursor = (element, cursor) => {
    element.style.cursor = cursor;
}

// 返回当前鼠标相对位置
const getMousePosition = (dom, e) => {
    const { left, top, width, height } = dom.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    return {
        x,
        y,
        left,
        top,
        width,
        height
    }
}



export default class Draw {
    /**
     * 
     * @param { HTMLElement } drawDom 放置canvas元素的dom
     * @param { String } imgUrl 图片路径
     * @param { Number } maxLength 最大画框数量 0 不限制
     */
    constructor(drawDom, imgUrl, colorInfo = {
        color: '#000000',
        activeColor: 'red'
    }, maxLength = 0) {
        this.drawDom = drawDom;
        const canvasDom = document.createElement('canvas');
        setCursor(canvasDom, 'pointer');
        this.canvasDom = canvasDom;
        this.drawDom.appendChild(canvasDom);
        this.ctx = canvasDom.getContext('2d');
        this.mapList = [];
        this.imgUrl = imgUrl;
        this.mapPointer = new MapPointerImg();
        this.imgDom = null;
        this.maxLength = maxLength;
        this.eventMap = new Map();
        this.colorInfo = colorInfo;
        // 当前鼠标是否选停在已经画好的区域内
        this.isSelected = false;
        // 当前选中的位置信息
        this.selectInfo = null;
        // 鼠标是否摁下
        this.isMouseDown = false;

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
            this.drawDom.style.backgroundSize = `${width}px ${height}px`;
        })
        img.src = this.imgUrl;
        this.imgDom = img
    }

    // 绘制缓存数据
    drawMapList() {
        // 实时绘制之前的map数据
        const { ctx, canvasDom } = this;
        ctx.strokeStyle = this.colorInfo.color;
        ctx.clearRect(0, 0, canvasDom.width, canvasDom.height);
        this.mapList.forEach(pointer => {
            ctx.beginPath();
            ctx.strokeRect(pointer.startX, pointer.startY, pointer.endX - pointer.startX, pointer.endY - pointer.startY);
            ctx.stroke();
        })
    }

    // 绘制描边矩形
    drawStrokeRect(mouseX, mouseY) {
        const { startX, startY } = this.mapPointer;
        const { ctx } = this;
        this.drawMapList();
        ctx.beginPath();
        ctx.strokeRect(startX, startY, mouseX - startX, mouseY - startY);
        ctx.stroke();
    }

    // 根据坐标点截取图片
    cutImg(mapPointer) {
        const { startX, startY, endX, endY } = mapPointer;
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
        const file = new File([blob], `${mapPointer.id}.png`, { type: 'image/png' });
        mapPointer.imgUrl = base64;
        mapPointer.imgFile = file;
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
     * @type {"limit"} key 
     * @param {Function} fun 
     */
    removeEventListener(key, fun) {
        const { eventMap } = this;
        const eventList = eventMap.get(key);
        if (eventList) {
            eventList.splice(eventList.indexOf(fun), 1);
        }
    }

    /**
     * 
     * @type {"limit"} key 
     * @param {Function} fun 
     */
    runEventListener() {
        const { eventMap } = this;
        eventMap.forEach(eventList => {
            eventList.forEach(fun => fun())
        })
    }

    /**
     * @description 检测鼠标移动区域
     */
    regionDetection(mouseX, mouseY) {
        const { mapList } = this;
        mapList.forEach(info => {
            // 判断鼠标是否移动到当前区域
            this.isSelected = MapPointerImg.isInArea(mouseX, mouseY, info);
            if (this.isSelected) {
                this.selectInfo = info;
                setCursor(this.canvasDom, 'grab');
            } else {
                setCursor(this.canvasDom, 'pointer');
            }
        })
    }

    /**
     * @description 移动选中的整个区域
     */
    moveSelectedArea(e) {
        const { x: downX, y: downY } = getMousePosition(this.canvasDom, e);
        const { selectInfo } = this;
        const resetSelectInfo = { ...selectInfo }
        if (!selectInfo) return;
        const move = e => {
            const { x, y, width, height } = getMousePosition(this.canvasDom, e);
            // 移动距离
            const spaceX = x - downX;
            const spaceY = y - downY;
            let newStartX = resetSelectInfo.startX + spaceX;
            let newStartY = resetSelectInfo.startY + spaceY;
            let newEndX = resetSelectInfo.endX + spaceX;
            let newEndY = resetSelectInfo.endY + spaceY;
            // 鼠标超出了canvas的范围
            if(newStartX < 0){
                newStartX = 0;
                newEndX = resetSelectInfo.width;
                newEndY = resetSelectInfo.height
            }
            if(newEndY < 0){
                newEndY = 0;
                newStartY = resetSelectInfo.height;
                newStartX = resetSelectInfo.width;
            }
            if(newEndX > width){
                newEndX = width;
                newStartX = resetSelectInfo.width;
                newStartY = resetSelectInfo.height;
            }
            if(newStartY > height){
                newStartY = height;
                newEndY = resetSelectInfo.height;
                newEndX = resetSelectInfo.width;
            }

            selectInfo.startX = newStartX
            selectInfo.startY = newStartY
            selectInfo.endX = newEndX
            selectInfo.endY = newEndY
            // 绘制
            this.drawMapList();
        }

        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            this.selectInfo = null;
            this.isSelected = false;
            this.isMouseDown = false;
            // 重新裁剪当前元素
            this.cutImg(selectInfo);
        }

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }


    /**
     * @description 注册事件
     */
    registeredEvents() {

        const down = (e) => {
            this.isMouseDown = true
            if (this.maxLength !== 0 && this.mapList.length >= this.maxLength) {
                this.runEventListener();
                document.removeEventListener('mousedown', down)
                return
            }
            // 按下的鼠标是否在区域内
            if (this.isSelected) {
                this.moveSelectedArea(e);
                return
            }
            // 记录按下坐标
            const { x, y } = getMousePosition(this.canvasDom, e);
            this.mapPointer.startX = x
            this.mapPointer.startY = y;

            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
        }

        const move = (e) => {
            // 计算移动时的坐标
            const { x, y, width, height } = getMousePosition(this.canvasDom, e);
            const mouseX = x;
            const mouseY = y;
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

        const up = () => {
            this.isMouseDown = false

            // 当endX，endY 小于 startX，startY则交换位置
            if (this.mapPointer.endX < this.mapPointer.startX) {
                [this.mapPointer.startX, this.mapPointer.endX] = [this.mapPointer.endX, this.mapPointer.startX];
            }
            if (this.mapPointer.endY < this.mapPointer.startY) {
                [this.mapPointer.startY, this.mapPointer.endY] = [this.mapPointer.endY, this.mapPointer.startY];
            }


            this.cutImg(this.mapPointer);
            // 当前作画的信息
            this.mapList.push({
                ...this.mapPointer
            })
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        }

        this.canvasDom.addEventListener('mousedown', down);


        const caMove = (e) => {
            if (this.isMouseDown) return
            const { x, y } = getMousePosition(this.canvasDom, e);
            this.regionDetection(x, y);
        }
        this.canvasDom.addEventListener('mousemove', caMove);
    }
}