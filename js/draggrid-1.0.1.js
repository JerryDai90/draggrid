$(function () {

    /**
                                                                                
    1. 拖拉
        1. 计算24个格子（x/y）的绝对像素点区间，比如
            3.33333% = 0~20
            10.33333% = 20~40

        2. 修改大小的时候判断拖拉的长度，对比百分值的区间是否修改大小（显示出拖动的效果图）

        3. 拖动的时候需要安装原来大小进行拖动，也只能进行格子之间的移动。

        4. 修改大小或者拖动的时候不能超出父容器的大小（24 * 24）

    2. 嵌套
        拖拉模板文件到指定的容器即可完成


    3. 容器嵌入容器为什么里面容器的100%就是外面容器的100%
    */

    window.cache = {
        currentDivObj: null //当前缓存的面板 div 对象
    };

    /*
     * 和面板相关的方法
     */
    var panel = {
        /*
         * 获取当前选中的面板 div 的父容器信息，每个面板 div 务必携带属性 data-ispanel
         */
        getCurrentSuperiorDivObj: function () {
            var temp = {
                divObj: $(window),
                isWindow: true
            }
            if (cache.currentDivObj != null) {
                var ispanel = cache.currentDivObj.parent("[data-ispanel]");
                if (ispanel.length != 0) {
                    temp.divObj = ispanel;
                    temp.isWindow = false;
                }
            }
            return temp;
        },
        getContainerDiv: function (_this) {
            return $(_this).closest('div.moveBar');
        },
        setOrResetZIndex: function (obj, isResetAction) {
            var zindex = 0;
            if (isResetAction) {
                zindex = $(obj).attr("data-oldzindex") || 0;
            } else {
                $(obj).attr("data-oldzindex", $(obj).css("z-index"));
                zindex = 99999;
            }
            $(obj).css("z-index", zindex);
        },
        /*
         * 获取父容器无效的偏移量，具体指定父容器和最外层的坐标
         */
        getParentContainerInvalidOffset: function () {
            //获取先对符框的顶点坐标，用于移动的时候减去外面的偏移量
            var left = 0;
            var top = 0;
            var currentSuperiorDivObj = this.getCurrentSuperiorDivObj();
            if (!currentSuperiorDivObj.isWindow) {
                left = currentSuperiorDivObj.divObj.offset().left;
                top = currentSuperiorDivObj.divObj.offset().top;
            }
            return {
                left: left,
                top: top
            };
        }

    };


    /*
     * 计算转率
     */
    var scaling = {
        /*
         * 24格比例，前后2个值为占位
         */
        scaleList: [0, 4.1666666667, 8.3333333334, 12.500000000, 16.666666667, 20.833333334, 25.00000000, 29.166666667, 33.333333334, 37.50000000, 41.666666667, 45.833333334, 50.000000000,
                                54.166666667, 58.333333334, 62.500000001, 66.666666667, 70.833333334, 75.000000001, 79.166666667, 83.333333334, 87.500000001, 91.666666667, 95.833333334, 100.000000000, 200.000000000],
        /*
         * 通过移动的距离来计算接近的固定比例值
         * @location 先对于父容器位移长度（也就是移动的高度或者宽度，只算移动距离）
         * @parentContainerLength 父容器的长度（直属父容器的高度或者宽度）
         */
        transform: function (shiftLength, parentContainerLength) {
            var _this = this;
            var xs = ((shiftLength - 2) / parentContainerLength * 100);
            var temp = null;
            $.each(_this.scaleList, function (i, _d) {
                if (_d > xs && _d <= _this.scaleList[i + 1]) {
                    temp = _d;
                    return false;
                }
            });
            return temp;
        },
        transformX: function (location) {
            return this.transform(location, this.getTransformDivObj().width()) + "%";
        },
        transformY: function (location) {
            return this.transform(location, this.getTransformDivObj().height()) + "%";
        },
        getTransformDivObj: function () {
            return panel.getCurrentSuperiorDivObj().divObj;
        },
        initScaleList : function(){
            var temp = [];
            temp.push(0);
            for( var i = 1; i <= 84; i++ ){
                temp.push(100/84*i);
            }
            temp.push(200);
            this.scaleList = temp;
            console.log(temp)
        }
    };
    
    scaling.initScaleList();



    $(document).mouseup(function (event) {
        
//            opacity: 0.7;
        $(this).unbind("mousemove");
        if (null != cache.currentDivObj) {
            panel.setOrResetZIndex(cache.currentDivObj, true);
            cache.currentDivObj.removeClass("opacity");
            
            cache.currentDivObj = null;
        }
    });

    //改变位置
    $('[name=banner]').mousedown(function (event) {
        var div = cache.currentDivObj = panel.getContainerDiv(this);
        panel.setOrResetZIndex(div, false);
        cache.currentDivObj.addClass("opacity");

        //获取当前面板的坐标
        var abs_x = event.pageX - div.offset().left;
        var abs_y = event.pageY - div.offset().top;
        //                console.log(".........>>>>>>>>>>>>>>..."+abs_x+" >"+abs_y);

        //获取先对符框的顶点坐标，用于移动的时候减去外面的偏移量
        var parentContainerInvalidOffset = panel.getParentContainerInvalidOffset();

        $(document).mousemove(function (event2) {

            //                    if( panel.getCurrentSuperiorDivObj().divObj.width() <= ((event2.pageX - parentContainerInvalidOffset.left - abs_x) + parseFloat(div.css("width")))){
            //                        return;  
            //                    }
            //                    if( panel.getCurrentSuperiorDivObj().divObj.height() <= ((event2.pageY - parentContainerInvalidOffset.top - abs_y) + parseFloat(div.css("height")))){
            //                        return;  
            //                    }
            //                    

            //                    console.log(panel.getCurrentSuperiorDivObj().divObj.width()+" -- " + )


            div.css({
                'left': scaling.transformX(event2.pageX - parentContainerInvalidOffset.left - abs_x),
                'top': scaling.transformY(event2.pageY - parentContainerInvalidOffset.top - abs_y),
            });
        });
    });

    //改变大小
    $('[name="resize"]').mousedown(function (event) {
        //面板对象    
        var div = cache.currentDivObj = panel.getContainerDiv(this);
        panel.setOrResetZIndex(div, false);

        //获取当前此面板的 xy 定点坐标，用于算出面板宽度
        var left = div.offset().left;
        var top = div.offset().top;

        $(document).mousemove(function (event2) {
            //得到面板的高宽
            var width = (event2.pageX - left);
            var height = (event2.pageY - top);
            div.css({
                "width": scaling.transformX(width),
                "height": scaling.transformY(height)
            });
        })
    });


});
