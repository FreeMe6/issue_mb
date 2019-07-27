/**
 * Created with JetBrains PhpStorm.
 * User: hn
 * Date: 13-5-29
 * Time: 下午8:01
 * To change this template use File | Settings | File Templates.
 */

(function () {
  
  var widgetName = 'combobox',
      itemClassName = 'edui-combobox-item',
      HOVER_CLASS = 'edui-combobox-item-hover',
      ICON_CLASS = 'edui-combobox-checked-icon',
      labelClassName = 'edui-combobox-item-label';
  
  UM.ui.define(widgetName, (function () {
    
    return {
      tpl: "<ul class=\"dropdown-menu edui-combobox-menu<%if (comboboxName!=='') {%> edui-combobox-<%=comboboxName%><%}%>\" unselectable=\"on\" onmousedown=\"return false\" role=\"menu\" aria-labelledby=\"dropdownMenu\">" +
      "<%if(autoRecord) {%>" +
      "<%for( var i=0, len = recordStack.length; i<len; i++ ) {%>" +
      "<%var index = recordStack[i];%>" +
      "<li class=\"<%=itemClassName%><%if( selected == index ) {%> edui-combobox-checked<%}%>\" data-item-index=\"<%=index%>\" unselectable=\"on\" onmousedown=\"return false\">" +
      "<span class=\"edui-combobox-icon\" unselectable=\"on\" onmousedown=\"return false\"></span>" +
      "<label class=\"<%=labelClassName%>\" style=\"<%=itemStyles[ index ]%>\" unselectable=\"on\" onmousedown=\"return false\"><%=items[index]%></label>" +
      "</li>" +
      "<%}%>" +
      "<%if( i ) {%>" +
      "<li class=\"edui-combobox-item-separator\"></li>" +
      "<%}%>" +
      "<%}%>" +
      "<%for( var i=0, label; label = items[i]; i++ ) {%>" +
      "<li class=\"<%=itemClassName%><%if( selected == i ) {%> edui-combobox-checked<%}%> edui-combobox-item-<%=i%>\" data-item-index=\"<%=i%>\" unselectable=\"on\" onmousedown=\"return false\">" +
      "<span class=\"edui-combobox-icon\" unselectable=\"on\" onmousedown=\"return false\"></span>" +
      "<label class=\"<%=labelClassName%>\" style=\"<%=itemStyles[ i ]%>\" unselectable=\"on\" onmousedown=\"return false\"><%=label%></label>" +
      "</li>" +
      "<%}%>" +
      "</ul>",
      defaultOpt: {
        //记录栈初始列表
        recordStack: [],
        //可用项列表
        items: [],
        //item对应的值列表
        value: [],
        comboboxName: '',
        selected: '',
        //自动记录
        autoRecord: true,
        //最多记录条数
        recordCount: 5
      },
      init: function (options) {
        
        var me = this;
        
        $.extend(me._optionAdaptation(options), me._createItemMapping(options.recordStack, options.items), {
          itemClassName: itemClassName,
          iconClass: ICON_CLASS,
          labelClassName: labelClassName
        });
        
        this._transStack(options);
        
        me.root($($.parseTmpl(me.tpl, options)));
        
        this.data('options', options).initEvent();
        
      },
      initEvent: function () {
        
        var me = this;
        
        me.initSelectItem();
        
        this.initItemActive();
        
      },
      /**
       * 初始化选择项
       */
      initSelectItem: function () {
        
        
        
        var me = this,
            labelClass = "." + labelClassName;
        /* 1 通过分析，这个me就是回初始化所有的弹出列表，主要有 段落、字体、字号 的选择的ul列表对象
         *
         * delegate() 方法为指定的元素（属于被选元素的子元素）添加一个或多个事件处理程序，并规定当这些事件发生时运行的函数。
         * 使用 delegate() 方法的事件处理程序适用于当前或未来的元素（比如由脚本创建的新元素）。
         */
        me.root().delegate('.' + itemClassName, 'click', function () {
          //$(this) 这里就是ul下面的li对象，li的下面还有其他的对象，从页面上可以进行分析获取。
          
          // MSG(`==>${$(this).html()}`);
          // let fontsize = $(this).children('label').html();
          // MSG(`选择的字号为：${fontsize}px`);
          // UM.getEditor('myEditor').execCommand('font-size',fontsize);
          
          
          //字体切换选择，这个需要一一对应编码，所以需要获取option
          // let fontFamilyGroup = UM.MyOption.fontfamily;
          // let getFontFamilyName = name => {
          //   for (let i = 0; i < fontFamilyGroup.length; i++) {
          //     if (fontFamilyGroup[i].name === name) {
          //       return i;
          //     }
          //   }
          //   return 0;
          // };
          // //字体绑定
          // $('.edui-container > .edui-toolbar > .edui-dialog-container > ul.edui-combobox-fontfamily > li').each(function () {
          //   if (!$(this).hasClass('edui-combobox-item-separator')) {
          //     $(this).attr('data-item-index', getFontFamilyName($(this).html()));
          //   }
          // });
          
          var $li = $(this),
              index = $li.attr('data-item-index');
          
          me.trigger('comboboxselect', {
            index: index,
            label: $li.find(labelClass).text(),
            value: me.data('options').value[index]
          }).select(index);
          
          me.hide();
          
          return false;
          
        });
        
      },
      initItemActive: function () {
        var fn = {
          mouseenter: 'addClass',
          mouseleave: 'removeClass'
        };
        if ($.IE6) {
          this.root().delegate('.' + itemClassName, 'mouseenter mouseleave', function (evt) {
            $(this)[fn[evt.type]](HOVER_CLASS);
          }).one('afterhide', function () {
          });
        }
      },
      /**
       * 选择给定索引的项
       * @param index 项索引
       * @returns {*} 如果存在对应索引的项，则返回该项；否则返回null
       */
      select: function (index) {
        
        var itemCount = this.data('options').itemCount,
            items = this.data('options').autowidthitem;
        
        if (items && !items.length) {
          items = this.data('options').items;
        }
        
        if (itemCount == 0) {
          return null;
        }
        
        if (index < 0) {
          
          index = itemCount + index % itemCount;
          
        } else if (index >= itemCount) {
          
          index = itemCount - 1;
          
        }
        
        this.trigger('changebefore', items[index]);
        
        this._update(index);
        
        this.trigger('changeafter', items[index]);
        
        return null;
        
      },
      selectItemByLabel: function (label) {
        
        var itemMapping = this.data('options').itemMapping,
            me = this,
            index = null;
        
        !$.isArray(label) && ( label = [label] );
        
        $.each(label, function (i, item) {
          
          index = itemMapping[item];
          
          if (index !== undefined) {
            
            me.select(index);
            return false;
            
          }
          
        });
        
      },
      /**
       * 转换记录栈
       */
      _transStack: function (options) {
        
        var temp = [],
            itemIndex = -1,
            selected = -1;
        
        $.each(options.recordStack, function (index, item) {
          
          itemIndex = options.itemMapping[item];
          
          if ($.isNumeric(itemIndex)) {
            
            temp.push(itemIndex);
            
            //selected的合法性检测
            if (item == options.selected) {
              selected = itemIndex;
            }
            
          }
          
        });
        
        options.recordStack = temp;
        options.selected = selected;
        temp = null;
        
      },
      _optionAdaptation: function (options) {
        
        if (!( 'itemStyles' in options )) {
          
          options.itemStyles = [];
          
          for (var i = 0, len = options.items.length; i < len; i++) {
            options.itemStyles.push('');
          }
          
        }
        
        options.autowidthitem = options.autowidthitem || options.items;
        options.itemCount = options.items.length;
        
        return options;
        
      },
      _createItemMapping: function (stackItem, items) {
        
        var temp = {},
            result = {
              recordStack: [],
              mapping: {}
            };
        
        $.each(items, function (index, item) {
          temp[item] = index;
        });
        
        result.itemMapping = temp;
        
        $.each(stackItem, function (index, item) {
          
          if (temp[item] !== undefined) {
            result.recordStack.push(temp[item]);
            result.mapping[item] = temp[item];
          }
          
        });
        
        return result;
        
      },
      _update: function (index) {
        
        var options = this.data("options"),
            newStack = [],
            newChilds = null;
        
        $.each(options.recordStack, function (i, item) {
          
          if (item != index) {
            newStack.push(item);
          }
          
        });
        
        //压入最新的记录
        newStack.unshift(index);
        
        if (newStack.length > options.recordCount) {
          newStack.length = options.recordCount;
        }
        
        options.recordStack = newStack;
        options.selected = index;
        
        newChilds = $($.parseTmpl(this.tpl, options));
        
        //重新渲染
        this.root().html(newChilds.html());
        
        newChilds = null;
        newStack = null;
        
      }
    };
    
  })(), 'menu');
  
})();
