// 生成随机Id
const randomId = () => {
    return Math.random().toString(36).substring(2);
}

function hypotenuse(a, b) {
    return Math.sqrt(a * a + b * b);
}

// 地图坐标类
class MapPointerImg {
    constructor(startX, startY, endX, endY, imgUrl, imgFile) {
        this.startX = startX || 0;
        this.startY = startY || 0;
        this.endX = endX || 0;
        this.endY = endY || 0;
        this.imgUrl = imgUrl || '';
        this.imgFile = imgFile || null;
        this.id = randomId();
    }

    get width() {
        return this.endX - this.startX;
    }

    get height() {
        return this.endY - this.startY;
    }

    set endx(val) {
        this.endX = val;
        this.width = val - this.startX
    }

    // 给一个坐标点 判断坐标点是否在当前区域
    static isInArea(x, y, mapPointer, arcInfo) {
        const isIn = x >= mapPointer.startX && x <= mapPointer.endX && y >= mapPointer.startY && y <= mapPointer.endY;
        // 是否在四个点上
        let location = ''
        if (x >= mapPointer.startX && x <= mapPointer.startX + arcInfo.radius && y >= mapPointer.startY && y <= mapPointer.startY + arcInfo.radius) {
            location = 'left-top'
        }
        if (x <= mapPointer.endX && x >= mapPointer.endX - arcInfo.radius && y >= mapPointer.startY && y <= mapPointer.startY + arcInfo.radius) {
            location = 'right-top'
        }
        if (x >= mapPointer.startX && x <= mapPointer.startX + arcInfo.radius && y <= mapPointer.endY && y >= mapPointer.endY - arcInfo.radius) {
            location = 'left-bottom'
        }
        if (x <= mapPointer.endX && x >= mapPointer.endX - arcInfo.radius && y <= mapPointer.endY && y >= mapPointer.endY - arcInfo.radius) {
            location = 'right-bottom'
        }
        if (location === '' && x >= mapPointer.endX - 40 && y <= mapPointer.startY + 20) {
            location = 'delete'
        }
        return {
            isIn,
            location
        };
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
     * @param { Number } minSize 最小绘制尺寸
     * @param { Array } mapList 初始数据
     * @param { Number } maxLength 最大画框数量 0 不限制
     * @param { Object } colorInfo 默认绘制颜色 选择颜色
     * @param { Object } arcInfo 选中4个角的颜色
     */
    constructor(drawDom, imgUrl, minSize = 50, mapList = [], maxLength = 0, colorInfo = {
        color: '#000000',
        activeColor: 'red',
        fontColoe: '#000000'
    }, arcInfo = {
        radius: 8,
        color: '#00ff00'
    }) {
        this.drawDom = drawDom;
        const canvasDom = document.createElement('canvas');
        setCursor(canvasDom, 'crosshair');
        this.canvasDom = canvasDom;
        this.drawDom.appendChild(canvasDom);
        this.ctx = canvasDom.getContext('2d');
        this.mapList = mapList;
        this.imgUrl = imgUrl;
        this.minSize = minSize;
        this.mapPointer = new MapPointerImg();
        this.imgDom = null;
        this.maxLength = maxLength;
        this.eventMap = new Map();
        this.colorInfo = colorInfo;
        this.arcInfo = arcInfo;
        // 选择区域按下的位置
        this.mouseDownLocation = '';
        // 当前鼠标是否选停在已经画好的区域内
        this.isSelected = false;
        // 当前选中的位置信息
        this.selectInfo = null;
        // 鼠标是否摁下
        this.isMouseDown = false;

        this.init();
    }

    remove(id) {
        this.mapList = this.mapList.filter(item => item.id !== id);
        this.drawMapList();
        this.runEventListener('change', this.mapList)
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
        ctx.clearRect(0, 0, canvasDom.width, canvasDom.height);
        this.mapList.forEach(pointer => {
            ctx.strokeStyle = this.colorInfo.color;
            if (pointer === this.selectInfo) {
                ctx.fillStyle = this.arcInfo.color;
                ctx.beginPath();
                ctx.arc(pointer.startX, pointer.startY, this.arcInfo.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(pointer.startX + pointer.width, pointer.startY, this.arcInfo.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(pointer.startX, pointer.startY + pointer.height, this.arcInfo.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(pointer.endX, pointer.endY, this.arcInfo.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fill();
                // 删除按钮
                ctx.font = '16px Arial';
                ctx.fillStyle = this.colorInfo.fontColoe;
                ctx.fillText('删除', pointer.endX - 40, pointer.startY + 20);
                ctx.strokeStyle = this.colorInfo.activeColor;
            }
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
     * @type {"change" | "limit" | “minSize”} limit 超出限制  minSize 移动最小距离
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
     * @type {"change" | "limit" | "“minSize”"}  
     * @param {Function} fun 
     */
    runEventListener(key, data = undefined) {
        const { eventMap } = this;
        const eventList = eventMap.get(key);
        (eventList || []).forEach(fun => fun(data))
    }

    /**
     * @description 检测鼠标移动区域
     */
    regionDetection(mouseX, mouseY) {
        const { mapList } = this;
        const areaList = [];
        let area = {};
        const findInfoList = mapList.filter(info => {
            const res = MapPointerImg.isInArea(mouseX, mouseY, info, this.arcInfo);
            if (res.isIn) {
                areaList.push(res)
            }
            return res.isIn
        });
        let findInfo = null;
        // 距离最近数组
        const spedList = findInfoList.map(info => {
            let min = mouseX - info.startX;
            min = Math.min(min, mouseY - info.startY);
            min = Math.min(min, info.endX - mouseX);
            min = Math.min(min, info.endY - mouseY);
            return min
        });
        const minSped = Math.min(...spedList);
        const minIndex = spedList.indexOf(minSped);
        if (minIndex > -1) {
            findInfo = findInfoList[minIndex];
            area = areaList[minIndex]
        }
        this.mouseDownLocation = area.location;
        if (findInfo) {
            // 判断鼠标是否移动到当前区域
            this.isSelected = true;
            this.selectInfo = findInfo;
            switch (area.location) {
                case 'left-top':
                    setCursor(this.canvasDom, 'nwse-resize');
                    break;
                case 'right-top':
                    setCursor(this.canvasDom, 'nesw-resize');
                    break;
                case 'left-bottom':
                    setCursor(this.canvasDom, 'nesw-resize');
                    break;
                case 'right-bottom':
                    setCursor(this.canvasDom, 'nwse-resize');
                    break
                case 'delete':
                    setCursor(this.canvasDom, 'pointer');
                    break;
                default:
                    setCursor(this.canvasDom, 'move');
                    break;
            }
        } else {
            this.reset();
            setCursor(this.canvasDom, 'crosshair');
        }
    }

    /**
     * 
     * @description 放大缩小
     */
    moveZoom(e) {
        const { x: downX, y: downY } = getMousePosition(this.canvasDom, e);
        const { selectInfo, mouseDownLocation } = this;
        const resetSelectInfo = { ...selectInfo };
        if (!selectInfo) return;
        const move = (e) => {
            const { x, y } = getMousePosition(this.canvasDom, e);
            const spaceX = x - downX;
            const spaceY = y - downY;
            let newStartX = resetSelectInfo.startX;
            let newStartY = resetSelectInfo.startY;
            let newEndX = resetSelectInfo.endX;
            let newEndY = resetSelectInfo.endY;
            switch (mouseDownLocation) {
                case 'left-top':
                    newStartX += spaceX
                    newStartY += spaceY
                    break;
                case 'right-top':
                    newStartY += spaceY
                    newEndX += spaceX
                    break;
                case 'left-bottom':
                    newStartX += spaceX
                    newEndY += spaceY
                    break;
                case 'right-bottom':
                    newEndX += spaceX
                    newEndY += spaceY
                    break;
                default:
                    break;
            }
            selectInfo.startX = newStartX
            selectInfo.startY = newStartY
            selectInfo.endX = newEndX
            selectInfo.endY = newEndY
            // 绘制
            this.drawMapList();
        }
        const up = () => {
            // 判断4个点是否交换位置
            let { startX, startY, endX, endY } = selectInfo;
            if (startX > endX) {
                [startX, endX] = [endX, startX];
            }
            if (startY > endY) {
                [startY, endY] = [endY, startY];
            }
            selectInfo.startX = startX
            selectInfo.startY = startY
            selectInfo.endX = endX
            selectInfo.endY = endY
            this.reset();
            // 重新裁剪当前元素
            this.cutImg(selectInfo);
            this.runEventListener('change', this.mapList)
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        }

        document.addEventListener('mousemove', move)
        document.addEventListener('mouseup', up);
    }

    /**
     * @description 移动选中的整个区域
     */
    moveSelectedArea(e) {
        const { x: downX, y: downY } = getMousePosition(this.canvasDom, e);
        const { selectInfo } = this;
        const resetSelectInfo = { ...selectInfo };
        const resetWidth = selectInfo.width;
        const resetHeight = selectInfo.height;
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
            {
                if (newStartX < 0) {
                    newStartX = 0;
                    newEndX = resetWidth;
                }

                if (newStartY < 0) {
                    newStartY = 0;
                    newEndY = resetHeight;
                }

                if (newEndX > width) {
                    newEndX = width;
                    newStartX = width - resetWidth;
                }

                if (newEndY > height) {
                    newEndY = height;
                    newStartY = height - resetHeight;
                }

            }
            selectInfo.startX = newStartX
            selectInfo.startY = newStartY
            selectInfo.endX = newEndX
            selectInfo.endY = newEndY
            // 绘制
            this.drawMapList();
        }

        const up = () => {
            this.reset();
            // 重新裁剪当前元素
            this.cutImg(selectInfo);
            this.runEventListener('change', this.mapList)
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        }

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }

    // 重置
    reset() {
        // this.selectInfo = null;
        this.isSelected = false;
        this.isMouseDown = false;
        this.location = false;
    }

    /**
     * @description 注册事件
     */
    registeredEvents() {
        let moveSapce = 0;
        let downX = 0;
        let downY = 0;
        const down = (e) => {
            moveSapce = 0;
            this.isMouseDown = true
            if (this.maxLength !== 0 && this.mapList.length >= this.maxLength) {
                this.runEventListener();
                return
            }
            // 按下的鼠标是否在区域内
            if (this.isSelected) {
                if (this.mouseDownLocation) {
                    this.moveZoom(e);
                } else {
                    this.moveSelectedArea(e);
                }
                return
            }
            // 记录按下坐标
            const { x, y } = getMousePosition(this.canvasDom, e);
            this.mapPointer = new MapPointerImg(x, y);
            downX = x;
            downY = y;
            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
        }

        const move = (e) => {
            // 计算移动时的坐标
            const { x, y, width, height } = getMousePosition(this.canvasDom, e);
            const mouseX = x;
            const mouseY = y;

            // 鼠标移动的距离的绝对值
            moveSapce = hypotenuse(Math.abs(mouseX - downX), Math.abs(mouseY - downY));

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
            this.reset();
            // 当endX，endY 小于 startX，startY则交换位置
            if (this.mapPointer.endX < this.mapPointer.startX) {
                [this.mapPointer.startX, this.mapPointer.endX] = [this.mapPointer.endX, this.mapPointer.startX];
            }
            if (this.mapPointer.endY < this.mapPointer.startY) {
                [this.mapPointer.startY, this.mapPointer.endY] = [this.mapPointer.endY, this.mapPointer.startY];
            }
            this.cutImg(this.mapPointer);
            // 当前作画的信息
            if (moveSapce > this.minSize) {
                this.mapList.push(this.mapPointer);
                this.runEventListener('change', this.mapList)
            } else {
                this.runEventListener('minSize')
            }
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        }

        this.canvasDom.addEventListener('mousedown', down);


        const caMove = (e) => {
            if (!this.mapList.length || this.isMouseDown) return
            const { x, y } = getMousePosition(this.canvasDom, e);
            this.regionDetection(x, y);
            this.drawMapList();
        }
        this.canvasDom.addEventListener('mousemove', caMove);


        const caClick = e => {
            // 是否点击在删除位置
            if (this.mouseDownLocation === 'delete') {
                // 删除位置
                this.mapList = this.mapList.filter(item => item.id !== this.selectInfo.id);
                this.drawMapList();
                this.runEventListener('change', this.mapList);
                this.reset();
                this.mouseDownLocation = '';
                setCursor(this.canvasDom, 'crosshair');
            }
        }
        this.canvasDom.addEventListener('click', caClick)
    }
}