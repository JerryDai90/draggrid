//$(function () {

$.fn.draggrid = function (defOpt) {
    return draggrid($(this), defOpt);
}

var draggrid = function (containerObj, option) {
    //        var containerId = "container";

    var self = this;
    var defOpt = {
        /*切割的格子个数*/
        gridNumber: 24,
        /*触发移动元素的名称*/
        btnMoveName: "_btnMove_",
        /*触发改变大小的元素名称*/
        btnResizeName: "_resize_",

    }

    $.extend(true, defOpt, option);
    self.option = defOpt;

    self._cache = {
        /*当前选中的面板 div 对象*/
        currentDivObj: null,
        /*容器格子比例，通过 gridNumber 个数来算出每个格子的百分比*/
        scaleList: [],
    }

    var util = {};
    util.scaling = {
        /*
         * 通过移动的距离来计算接近的固定比例值
         * @location 先对于父容器位移长度（也就是移动的高度或者宽度，只算移动距离）
         * @parentContainerLength 父容器的长度（直属父容器的高度或者宽度）
         */
        transform: function (shiftLength, parentContainerLength, scaleList) {
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
            return this.transform(location, this.getTransformDivObj().width(), self._cache.scaleList) + "%";
        },
        transformY: function (location) {
            return this.transform(location, this.getTransformDivObj().height(), self._cache.scaleList) + "%";
        },
        getTransformDivObj: function () {
            return util.panel.getCurrentSuperiorDivObj().divObj;
        },
        initScaleList: function (gridNumber) {
            gridNumber = undefined == gridNumber || null == gridNumber ? 24 : gridNumber;
            var temp = [];
            temp.push(0);
            for (var i = 1; i <= gridNumber; i++) {
                temp.push(100 / gridNumber * i);
            }
            temp.push(200);
            this.scaleList = temp;
            console.log(temp);
        }
    }


    util.panel = {
        /*
         * 获取当前选中的面板 div 的父容器信息，每个面板 div 务必携带属性 data-ispanel
         */
        getCurrentSuperiorDivObj: function () {
            //                debugger;
            var temp = {
                divObj: $(window),
                isWindow: true
            }
            if (self._cache.currentDivObj != null) {
                var ispanel = self._cache.currentDivObj.parents("div[data-ispanel]");
                if (ispanel.length != 0) {
                    temp.divObj = ispanel;
                    temp.isWindow = false;
                }
            }
            return temp;
        },
        getContainerDiv: function (_this) {
            return $(_this).closest('div.draggrid-panel');
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
            //                debugger;
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


    var event = function () {
        $(document).mouseup(function (event) {

            $(this).unbind("mousemove");
            if (null != self._cache.currentDivObj) {
                util.panel.setOrResetZIndex(self._cache.currentDivObj, true);
                self._cache.currentDivObj.removeClass("opacity").children("[name=childShade]").hide();
                self._cache.currentDivObj = null;
            }
        });

        //改变位置
        $(document).on("mousedown", "[name=" + self.option.btnMoveName + "]", function (event) {
            var div = self._cache.currentDivObj = util.panel.getContainerDiv(this);
            util.panel.setOrResetZIndex(div, false);
            self._cache.currentDivObj.addClass("opacity");

            //获取当前面板的坐标
            var abs_x = event.pageX - div.offset().left;
            var abs_y = event.pageY - div.offset().top;
            //                console.log(".........>>>>>>>>>>>>>>..."+abs_x+" >"+abs_y);

            //获取先对符框的顶点坐标，用于移动的时候减去外面的偏移量
            var parentContainerInvalidOffset = util.panel.getParentContainerInvalidOffset();
            //                console.log(parentContainerInvalidOffset)

            $(document).mousemove(function (event2) {

                console.log((parseFloat(div.css("top")) + parseFloat(div.css("height"))) + "--" + parseFloat(util.panel.getCurrentSuperiorDivObj().divObj.height()));

                //                    if(event.pageY - event2.pageY <= 0){
                //                        if( (parseFloat(div.css("top")) + parseFloat(div.height())) >= parseFloat(util.panel.getCurrentSuperiorDivObj().divObj.height()) ){
                //                            return;
                //                        }
                //                    }
                //                    
                //                    if(event.pageX - event2.pageX <= 0){
                //                        if( (parseFloat(div.css("left")) + parseFloat(div.width())) >= parseFloat(util.panel.getCurrentSuperiorDivObj().divObj.width()) ){
                //                            return;
                //                        }
                //                    }

                div.css({
                    'left': util.scaling.transformX(event2.pageX - parentContainerInvalidOffset.left - abs_x),
                    'top': util.scaling.transformY(event2.pageY - parentContainerInvalidOffset.top - abs_y),
                });
            });
        });

        //改变大小
        $(document).on("mousedown", "[name=" + self.option.btnResizeName + "]", function (event) {
            event.stopPropagation();
            //面板对象    
            var div = self._cache.currentDivObj = util.panel.getContainerDiv(this);
            util.panel.setOrResetZIndex(div, false);
            div.children("[name=childShade]").show();

            //获取当前此面板的 xy 定点坐标，用于算出面板宽度
            var left = div.offset().left;
            var top = div.offset().top;

            $(document).mousemove(function (event2) {

                //                    if(event.pageY - event2.pageY <= 0){
                //                        if( (parseFloat(div.css("top")) + parseFloat(div.height())) >= parseFloat(util.panel.getCurrentSuperiorDivObj().divObj.height()) ){
                //                            return;
                //                        }
                //                    }
                //                    
                //                    if(event.pageX - event2.pageX <= 0){
                //                        if( (parseFloat(div.css("left")) + parseFloat(div.width())) >= parseFloat(util.panel.getCurrentSuperiorDivObj().divObj.width()) ){
                //                            return;
                //                        }
                //                    }

                //得到面板的高宽
                var width = (event2.pageX - left);
                var height = (event2.pageY - top);
                div.css({
                    "width": util.scaling.transformX(width),
                    "height": util.scaling.transformY(height)
                });
            })
        });

        /*触发修改按钮*/
        $(document).on("click", "[name=_btnTriggerResize_]", function (event) {
            var div = self._cache.currentDivObj = util.panel.getContainerDiv(this);
            div.children("[name=childShade]").show();
        });

        /*删除*/
        $(document).on("click", "[name=_btnDel_]", function (event) {
            util.panel.getContainerDiv(this).remove();
        });


    }

    //<div name="childPanel" style="width: 100%;height: 100%;"></div>\
    /*
    <span class="draggrid-hide"></span>\
                        <span class="draggrid-hide"></span>\
                        <span class="draggrid-hide"></span>\*/
    var html = '<div class="draggrid-panel" name="_panel_div_" data-ispanel id="$id" data-pid="$pid" data-loadMode="$loadMode" data-url="$url" style="z-index: $z-index; background: $background; top: $top%; left:$left%; width:$width%; height:$height%;">\
                        <div name="banner" class="draggrid-operation draggrid-none-select">\
                            <a class="draggrid-btn-delete-img draggrid-btn-base-img" name="_btnDel_" title="删除"></a>\
                            <a class="draggrid-btn-move-img draggrid-btn-base-img" name="_btnMove_" title="移动"></a>\
                            <a class="draggrid-btn-resize-img draggrid-btn-base-img" name="_btnTriggerResize_" title="修改大小"></a>\
                        </div>\
                        <div name="childShade" class="draggrid-fullscreen draggrid-childshade draggrid-hide">\
                            <img class="draggrid-resize-img" name="_resize_" style="z-index: $z-index;"></img>\
                        </div>\
                        <div name="childPanel" class="draggrid-fullscreen draggrid-childpanel" data-loadMode="$loadMode" data-url="$url"></div>\
                    </div>';
    var x = [
            '#2E2EFE', '#FF00BF', '#FACC2E', '#FAAC58', '#61210B', '#08088A', '#E6E6E6'
        ];
    var template = function (i, _d) {
        var temp = html.replace(/\$id/g, _d.id).replace(/\$name/g, _d.name)
            .replace(/\$top/g, _d.y).replace(/\$left/g, _d.x)
            .replace(/\$width/g, _d.width).replace(/\$height/g, _d.height)
            .replace(/\$pid/g, _d.pId)
            .replace(/\$loadMode/g, _d.loadMode).replace(/\$url/g, _d.url)
            .replace(/\$z-index/g, _d.zIndex)
            .replace(/\$background/g, x[i]);
        return temp;
    }

    self.addGrid = function (jsonData) {
        $.each(jsonData, function (i, _d) {
            if (_d.pId == '-1') {
                $(containerObj).append(template(i, _d));
            }
        });

        //子模块要算出先后顺序，否则会找不到父容器。
        $.each(jsonData, function (i, _d) {
            if (_d.pId != '-1') {
                //反向查询查询层级关系，设置值就不会出现穿透问题。
                var zIndex = $("#" + _d.pId).find("[name=_resize_]").css("z-index");
                zIndex = "auto" == zIndex || zIndex == undefined ? 0 : parseInt(zIndex);
                //                    console.log(zIndex)
                _d.zIndex = ++zIndex;
                $("#" + _d.pId).children("[name=childPanel]").html(template(i, _d));
            }
        });

        //构建子页面
        $.each(containerObj.find("[name=childPanel]"), function (i, _d) {

            if ($(_d).html().length == 0) {
                var url = $(_d).attr("data-url");
                var loadMode = $(_d).attr("data-loadmode");
                if (loadMode == "iframe") {
                    var childHtml = '<iframe style="border:0px;" width="100%" height="100%" src="' + url + '"></iframe>'
                    $(_d).html(childHtml);
                } else if (loadMode == "div") {
                    //                        debugger;
                    $(_d).load(url);
                }
            }
        })
    };

    self.getAllPanelData = function () {
        var _data = [];
        $.each($(containerObj).find("[name=_panel_div_]"), function (i, _d) {
            _data.push({
                id : $(_d).attr("id"),
                pId : $(_d).attr("data-pid") || "-1",
                x : _d.style.top,
                y : _d.style.left,
                width : _d.style.width,
                height : _d.style.height,
                loadMode : $(_d).attr("data-loadMode"),
                url : $(_d).attr("data-url") || ""
            })
        });
        return _data;
    };

    var init = function () {
        util.scaling.initScaleList(self.option.gridNumber);
        event();
    }

    init();
    containerObj.data("obj", self);
    return self;
}

//});
