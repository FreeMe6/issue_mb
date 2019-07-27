//button 类
UM.ui.define('button', {
  tpl: '<<%if(!texttype){%>div class="edui-btn edui-btn-<%=icon%> <%if(name){%>edui-btn-name-<%=name%><%}%>" unselectable="on" onmousedown="return false" <%}else{%>a class="edui-text-btn"<%}%><% if(title) {%> data-original-title="<%=title%>" <%};%>> ' +
  '<% if(icon) {%><div unselectable="on" class="edui-icon-<%=icon%> edui-icon"></div><% }; %><%if(text) {%><span unselectable="on" onmousedown="return false" class="edui-button-label"><%=text%></span><%}%>' +
  '<%if(caret && text){%><span class="edui-button-spacing"></span><%}%>' +
  '<% if(caret) {%><span unselectable="on" onmousedown="return false" class="edui-caret"></span><% };%></<%if(!texttype){%>div<%}else{%>a<%}%>>',
  defaultOpt: {
    text: '',
    title: '',
    icon: '',
    width: '',
    caret: false,
    texttype: false,
    click: function () {
    }
  },
  init: function (options) {
    var me = this;
    
    me.root($($.parseTmpl(me.tpl, options)))
        .click(function (evt) {
          me.wrapclick(options.click, evt);
          
          //#01 解决umeditor字体不能选择的问题
          let bindIndexOfFontSize = (opt,$ul) => {
            let c = 0;
            // if(opt.fontsize){
            //   c = 0
            // }else{
            //   c = 0;
            // }
            $ul.find('li').each(function () {
              $(this).attr('data-item-index', c);
              c++;
            });
          };
          // 字体切换选择，这个需要一一对应编码，所以需要获取option
          let bindIndexOfFontFamily = (opt, $ul) => {
            let ffg = opt.fontfamily;
            
            //从配置中找到对应的编号，编号就是配置的字体组的下标
            let getFontFamilyName = name => {
              for (let i = 0; i < ffg.length; i++) {
                if (ffg[i].name === name) {
                  return i;
                }
              }
              return 0;
            };
            //固定编号即可实现，关键是和你配置的顺序一只即可解决。
            
            if ($ul.find('.edui-combobox-item-separator').length < 1) {
              let c = 0;
              //字体绑定
              $ul.find('li').each(function () {
                $(this).attr('data-item-index', c);
                c++;
              });
            } else {
              //字体绑定
              $ul.find('li').each(function () {
                if (!$(this).hasClass('edui-combobox-item-separator')) {
                  $(this).attr('data-item-index', getFontFamilyName($(this).children('label').html()));
                }
              });
            }
          };
          
          
          bindIndexOfFontFamily(UM.MyOption, $('.edui-container > .edui-toolbar > .edui-dialog-container > ul.edui-combobox-fontfamily'));
          bindIndexOfFontSize(UM.MyOption,$('.edui-container > .edui-toolbar > .edui-dialog-container > ul.edui-combobox-fontsize'));
          
        });
    
    me.root().hover(function () {
      if (!me.root().hasClass("edui-disabled")) {
        me.root().toggleClass('edui-hover')
      }
    });
    
    return me;
  },
  wrapclick: function (fn, evt) {
    if (!this.disabled()) {
      this.root().trigger('wrapclick');
      $.proxy(fn, this, evt)()
    }
    return this;
  },
  label: function (text) {
    if (text === undefined) {
      return this.root().find('.edui-button-label').text();
    } else {
      this.root().find('.edui-button-label').text(text);
      return this;
    }
  },
  disabled: function (state) {
    if (state === undefined) {
      return this.root().hasClass('edui-disabled')
    }
    this.root().toggleClass('edui-disabled', state);
    if (this.root().hasClass('edui-disabled')) {
      this.root().removeClass('edui-hover')
    }
    return this;
  },
  active: function (state) {
    if (state === undefined) {
      return this.root().hasClass('edui-active')
    }
    this.root().toggleClass('edui-active', state)
    
    return this;
  },
  mergeWith: function ($obj) {
    var me = this;
    me.data('$mergeObj', $obj);
    $obj.edui().data('$mergeObj', me.root());
    if (!$.contains(document.body, $obj[0])) {
      $obj.appendTo(me.root());
    }
    me.on('click', function () {
      me.wrapclick(function () {
        $obj.edui().show();
      })
    }).register('click', me.root(), function (evt) {
      $obj.hide()
    });
  }
});