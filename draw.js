/*
 * DrawJS - HTML5 vector manipulation library http://drawjs.cmshum.com
 * by Adrian CM Shum http://cmshum.com
 * 
 * built with HTML5 Canvas and Mootools framework
 * 
 */

window.drawjs = window.drawjs || {};

drawjs.config = {
	
}


drawjs.Styling = new Class({
	Implements:[Options,Events],
	options:{
		fill:'',
		stroke:'#000',
		lineWidth:2,
		text:'',
		fontFamily:'Arial',
		textAlign:'left',
		textVAlign:'top',
		textFill:'#000',
		fontSize:20,
		lineHeightEm:1.2
	},
	initialize:function(selection,history){
		this.selection = selection;
		this.history = history;
		
		//init events
		var self = this;
		this.selection.addEvent('select',function(e){
			if(e.selected.length==1){
				var options = e.selected[0].get();
				Object.each(self.options,function(dummy,key){
					if(options[key]!=null){
						self.grabStyle(key,options[key]);
					}
				});
			}
				//self.set(e.selected[0].get(Object.keys(self.options)));
		});
	},
	setStyle:function(key,value){
		var self = this;
		this.grabStyle(key,value);
		var selected = this.selection.getSelected();
		if(selected.length>0){
			this.history.save(selected.map(function(shape){
				shape.set(self.get([key],true));
				return new drawjs.record.Shape(shape);
			}));
		}
	},
	grabStyle:function(key,value){
		
		this.options[key] = value;
		this.fireEvent('change',this.get([key],true));
	},
	get:function(keys,hasText){
		//no text initially
		if(!hasText)
			this.options.text = '';
		
		return keys ? Object.subset(this.options,keys) : Object.clone(this.options);
	}
});

drawjs.Selection = new Class({
	Implements:Events,
	initialize:function(){
		var self = this;
		this.selected = [];
		this.initEvent();
	},
	initEvent:function(){
		var self = this;
		this.shapeChange = function(shape){
			if(!shape.isVisible())
				self.deselect();
		}
	},
	select:function(selected){
		var self = this;
		selected = Array.from(selected);
		if(this.selected.length>0)
			this.deselect();
		if(selected.length > 0){
			this.selected = selected.each(function(shape){
				shape.addEvent('change',self.shapeChange);
			});
			this.fireEvent('select',{
				selected:self.getSelected()
			});
		}else
			this.deselect();
	},
	deselect:function(){
		var self = this;
		this.selected.each(function(shape){
			shape.removeEvent('change',self.shapeChange);
		});
		this.selected.empty();
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
		this.fireEvent('deselect');
	},
	getSelected:function(){
		return this.selected.map(function(shape){
			return shape;
		});
	}
});

drawjs.Transform = new Class({
	initialize:function(shapes){
		var minX=16667;var minY=16667;
		var maxX=-16667;var maxY=-16667;
		
		this.shapes = Array.from(shapes).map(function(shape){
			var s = shape.getBound();
			minX = Math.min(s.x,minX);
			minY = Math.min(s.y,minY);
			maxX = Math.max(s.x+s.width,maxX);
			maxY = Math.max(s.y+s.height,maxY);
			return {
				x:s.x,
				y:s.y,
				width:s.width,
				height:s.height,
				shape:shape
			}
		});
		if(this.shapes.length>0){
			this.x = minX;
			this.y = minY;
			this.width = maxX - minX;
			this.height = maxY - minY;
		}else{
			this.x = -1;
			this.y = -1;
			this.width = 1;
			this.height = 1;
		}
		this.isFlipX = false;
		this.isFlipY = false;
		
	},
	setPosition:function(x,y){
		this.translate(x-this.x,y-this.y);
	},
	translate:function(dx,dy){
		this.x += dx;
		this.y += dy;
		this.shapes.each(function(s){
			s.x += dx;
			s.y += dy;
		});
		this.apply();
	},
	setSize:function(w,h,lines){
		var self = this;
		if(w==0) w = this.width<0 ? w=-1 : w=1;
		if(h==0) h = this.height<0 ? h=-1 : h=1;
		this.scale(w/this.width ,h/this.height,lines);
	},
	resize:function(dw,dh,lines){
		var w = this.width + dw;
		if(w==0) w += dw;
		var h = this.height + dh;
		if(h==0) h += dh;
		
		this.scale(w/this.width, h/this.height,lines);
	},
	scale:function(rw,rh,lines){
		if(this.width < 0 != this.width*rw < 0)
			this.isFlipX = !this.isFlipX;
		if(this.height < 0 != this.height*rh < 0)
			this.isFlipY = !this.isFlipY;
		
		this.width = Math.round(this.width*rw);
		this.height = Math.round(this.height*rh);
		
		var self = this;
		this.shapes.each(function(s){
			s.x = self.x + (s.x-self.x)*rw;
			s.y = self.y + (s.y-self.y)*rh;
			s.width *= rw;
			s.height *= rh;
		});
		this.apply();
	},
	flipX:function(){
		var self = this;
		this.shapes.each(function(s){
			s.x = self.x + self.width - s.width - (s.x-self.x)
		});
		this.isFlipX = !this.isFlipX;
		this.apply();
	},
	flipY:function(){
		var self = this;
		this.shapes.each(function(s){
			s.y = self.y + self.height - s.height - (s.y-self.y);
		});
		this.isFlipY = !this.isFlipY;
		this.apply();
	},
	apply:function(){
		var self = this;
		this.shapes.each(function(s){
			var shape = s.shape;
			shape.setPosition(
				Math.min(s.x,s.x+s.width),
				Math.min(s.y,s.y+s.height)
			);
			shape.setSize(
				Math.abs(s.width),
				Math.abs(s.height)
			);
			if(self.isFlipX) shape.flipX();
			if(self.isFlipY) shape.flipY();
		});
		this.isFlipX = false;
		this.isFlipY = false;
	}.protect(),
	getBound:function(){
		return {
			x:Math.min(this.x,this.x+this.width),
			y:Math.min(this.y,this.y+this.height),
			width:Math.abs(this.width),
			height:Math.abs(this.height)
		};
	}
});

(function(){

var clipboard = [];

drawjs.Clipboard = new Class({
	initialize:function(selection,canvas,history){
		this.selection = selection;
		this.canvas = canvas;
		this.history = history;
	},
	cut:function(){
		this.copy();
		this.hide();
	},
	copy:function(){
		var selected = this.selection.getSelected();
		if(selected.length>0)
			clipboard = selected.map(function(shape){
				return shape.clone();
			});
	},
	paste:function(){
		if(clipboard.length>0){
			var self = this;
			var clone = clipboard.map(function(shape){
				return shape.clone();
			});
			/*
			var transform = new drawjs.Transform(clone);
			var t = transform.getBound();
			var c = this.canvas.getSize();
			transform.setPosition(
				(c.width-t.width)/2,
				(c.height-t.height)/2
			);
			*/
			this.history.save(clone.map(function(shape){
				self.canvas.getFocus().add(shape);
				return new drawjs.record.Shape(shape);
			}));
			this.selection.select(clone);
		}
	},
	hide:function(){
		var selected = this.selection.getSelected();
		if(selected.length>0){
			this.history.save(
				selected.map(function(shape){
					shape.setVisible(false);
					return new drawjs.record.Shape(shape);
				})
			);
		}
	}
});

})();

drawjs.History = new Class({
	Implements:Events,
	initialize:function(ui){
		var self = this;
		
		this.undoList = [];
		this.redoList = [];
		this.ui = ui;
	},
	getState:function(){
		var undoLen = this.undoList.length;
		var redoLen = this.redoList.length;
		return {
			undoable:undoLen >0,
			redoable:redoLen >0,
			length:undoLen + redoLen,
			index:undoLen
		}
	},
	save:function(records){
		this.undoList.push(Array.from(records));
		this.redoList.empty();
		this.fireEvent('save',this.getState());
	},
	undo:function(){
		if(this.undoList.length>0){
			var records = this.undoList.pop();
			records.each(function(record){
				record.undo();
			});
			this.redoList.push(records);
			this.fireEvent('change',this.getState());
			this.fireEvent('undo',this.getState());
		}
	},
	redo:function(){
		if(this.redoList.length>0){
			var records = this.redoList.pop();
			records.each(function(record){
				record.redo();
			});
			this.undoList.push(records);
			this.fireEvent('change',this.getState());
			this.fireEvent('redo',this.getState());
		}
	}
});


drawjs.record = {};
drawjs.record.Template = new Class({
	initialize:function(){},
	undo:function(){},
	redo:function(){}
});

(function(){

var map = {};

drawjs.record.Shape = new Class({
	initialize:function(shape){
		this.shape = shape;
		
		this.before = Object.clone(this.getMap(this.shape));
		this.after = this.shape.get();
		Object.each(this.before,function(el,i){
			if(this.after[i] == el){
				delete this.before[i];
				delete this.after[i];
			}
		},this);
		Object.append(this.getMap(this.shape),this.after);
	},
	getMap:function(shape){
		var id = shape.getId();
		map[id] = map[id] || {visible:false};
		return map[id];
	},
	undo:function(){
		this.shape.set(this.before);
		Object.append(this.getMap(this.shape),this.before);
	},
	redo:function(){
		this.shape.set(this.after);
		Object.append(this.getMap(this.shape),this.after);
	}
});

})();

drawjs.record.Canvas = new Class({
	
});

drawjs.record.Layer = new Class({
	
});

drawjs.Toolset = new Class({
	Implements:Events,
	initialize:function(canvas,selection,history,styling,Tools){
		var self = this;
		
		this.canvas = canvas;
		this.selection = selection;
		this.history = history;
		this.styling = styling;
		
		this.tool = null;
		this.tools = {};
		
		
		Tools.each(function(Tool){
			var tool = new Tool(self,canvas,selection,history,styling);
			self.tools[tool.getType()] = tool;
		});
		
		var details = function(e){
			var pos = self.canvas.getPosition();
			return Object.merge(e,{
				x:(e.page.x-pos.x),
				y:(e.page.y-pos.y)
			});
		}
		
		Array.each(['select','deselect'],function(evtName){
			selection.addEvent(evtName,function(e){
				self.tool[evtName](e);
			});
		});
		
		history.addEvent('change',function(e){
			self.tool.change(e);
		});
		
		var id = this.canvas.getId();
		['mousedown','click','dblclick'].each(function(evtName){
			$(id).addEvent(evtName,function(e){
				self.tool[evtName](details(e));
				e.stop();
			});
		});
		['mousemove','mouseup','keydown'].each(function(evtName){
			$(window).addEvent(evtName,function(e){
				self.tool[evtName](details(e));
			});
		});
	},
	setType:function(type){
		if(this.tools[type]){
			if(this.tool){
				this.tool.leave();
				this.fireEvent('leave',this.tool.getType());
			} 
			this.tool = this.tools[type];
			this.tool.enter();
			this.fireEvent('enter',type);
		}
	},
	getType:function(){
		return this.tool.getType();
	}
});

drawjs.tool = {};

drawjs.tool.Template = new Class({
	initialize:function(set,canvas,operation,history,styling){
		this.set = set;
		this.canvas = canvas;
		this.selection = operation;
		this.history = history;
		this.styling = styling;
		
		this.init();
	},
	init:function(){},
	getType:function(){},
	select:function(e){},
	deselect:function(e){},
	change:function(){},
	enter:function(){},
	leave:function(){},
	mousemove:function(e){},
	mousedown:function(e){},
	mouseup:function(e){},
	click:function(e){},
	dblclick:function(e){},
	keydown:function(e){}
});

drawjs.tool.Selector = new Class({
	Extends:drawjs.tool.Template,
	getType:function(){
		return 'selector';
	},
	init:function(){
		this.controlLayer = new drawjs.Layer({system:true});
		this.frame = new drawjs.shape.Rect({
			'stroke':'#000','lineWidth':1
		});
		this.controlLayer.add(this.frame);
		this.dots = [];
		for(var i=0;i<9;i++){
			var dot = new drawjs.shape.Rect({
				'fill':'#fff','stroke':'#000',
				'lineWidth':1,'width':10,'height':10,
				'visible':false
			});
			this.dots.push(dot);
			if(i!=4) this.controlLayer.add(dot);
		}
	},
	select:function(){
		this.refresh();
	},
	deselect:function(){
		this.refresh();
	},
	change:function(){
		this.refresh();
	},
	enter:function(){
		this.canvas.push(this.controlLayer);
		this.refresh();
	},
	leave:function(){
		this.canvas.pop();
	},
	dblclick:function(e){
		var selected = this.selection.getSelected();
		if(selected.length==1){
			this.set.setType(selected[0].getType());
		}
	},
	mousedown:function(e){
		this.pressed = true;
		this.dragged = false;
		this.prevX = e.x;
		this.prevY = e.y;
		
		this.focus = this.controlLayer.select(e.x,e.y) || this.canvas.select(e.x,e.y);
		
		switch(this.focus){
			case this.frame:case this.dots[0]:case this.dots[1]:
			case this.dots[2]:case this.dots[3]: case this.dots[5]:
			case this.dots[6]:case this.dots[7]:case this.dots[8]:
			break;
			case null: //no shapes selected, i.e. start draw frame 
				this.selection.deselect();
				this.transform.setPosition(e.x,e.y);
				this.transform.setSize(0,0);
			break;
			default: //single shape selected
				if(!this.selection.getSelected().contains(this.focus))
					this.selection.select(this.focus);
			break;
		}
	},
	mousemove:function(e){
		if(this.pressed){
			this.dragged = true;
			
			var t = this.transform;
			var dx = e.x-this.prevX;
			var dy = e.y-this.prevY;
			switch (this.focus){
				case this.dots[0]: t.translate(dx,dy); t.resize(-dx,-dy); break;
				case this.dots[1]: t.translate(0,dy); t.resize(0,-dy); break;
				case this.dots[2]: t.translate(0,dy); t.resize(dx,-dy); break;
				case this.dots[3]: t.translate(dx,0); t.resize(-dx,0); break;
				case this.dots[5]: t.resize(dx,0); break;
				case this.dots[6]: t.translate(dx,0); t.resize(-dx,dy); break;
				case this.dots[7]: t.resize(0,dy); break;
				case this.dots[8]:case null: t.resize(dx,dy); break;
				default: t.translate(dx,dy); break;
			}
			this.setFrame();
			
			this.prevX = e.x;
			this.prevY = e.y;
		}else{
			var cursor;
			switch (this.controlLayer.select(e.x,e.y)){
				case this.dots[0]: cursor = 'nw-resize'; break;
				case this.dots[1]: cursor = 'n-resize'; break;
				case this.dots[2]: cursor = 'ne-resize'; break;
				case this.dots[3]: cursor = 'w-resize'; break;
				case this.dots[5]: cursor = 'e-resize'; break;
				case this.dots[6]: cursor = 'sw-resize'; break;
				case this.dots[7]: cursor = 's-resize'; break;
				case this.dots[8]: cursor = 'se-resize'; break;
				case this.frame: cursor = 'move'; break;
				default: cursor = 'default'; break;
			}
			this.canvas.setCursor(cursor);			
		}

	},
	mouseup:function(){
		if(this.pressed){
			this.pressed = false;
			if(!this.focus){
				//nothing selected i.e. frame dragged
				this.selection.select(this.canvas.bound(this.transform.getBound()));
			}else if(this.dragged){
				//save changes & reset bound
				this.history.save(this.selection.getSelected().map(function(shape){
					return new drawjs.record.Shape(shape);
				}));
				this.refresh();
			}
		}
	},
	refresh:function(){
		this.transform = new drawjs.Transform(this.selection.getSelected());
		this.setFrame();
	},
	setFrame:function(){
		var b = this.transform.getBound();
		var showDots = this.selection.getSelected().length>0;
		this.frame.setVisible(true);
		this.frame.setPosition(b.x,b.y);
		this.frame.setSize(b.width,b.height);
		this.dots.each(function(dot,i){
			dot.setVisible(showDots);
			dot.setPosition(b.x+((i%3)/2*b.width).toInt()-5, 
			b.y+((i/3).toInt()/2*b.height).toInt()-5);
		});
	}
});

drawjs.tool.HSwap = new Class({
	Extends:drawjs.tool.Template,
	getType:function(){
		return 'swap';
	},
	init:function(){
		this.states = [];
	},
	enter:function(){
		this.selection.deselect();
	},
	mousedown:function(e){
		if(this.states.length==0){
			this.current = new drawjs.shape.Path({
				lineWidth:2,stroke:'#f00'
			});
			this.canvas.getFocus().add(this.current);
			this.states.push(e);
		}
		this.states.push(e);
		this.draw();
		if(this.states.length>3){
			//this.selection.select(this.current);
			this.history.save(new drawjs.record.Shape(this.current));
			this.states.empty();
		}
	},
	mouseup:function(e){
		if(this.states.length==2){
			this.states.push(e);
		}
	},
	mousemove:function(e){
		if(this.states.length>0)
			this.states[this.states.length-1] = e;
		this.draw();
	},
	draw:function(){
		var es = this.states;
		if(es.length>0){
			this.current.clear();
			this.current.moveTo(es[0].x,es[0].y);
		}
		if(es.length>1){
			this.current.lineTo(es[1].x,es[0].y);
			this.current.lineTo(es[1].x,es[1].y);
		}
		if(es.length>2){
			this.current.lineTo(es[2].x,es[1].y);
		}
	}
});

drawjs.tool.VSwap = new Class({
	Extends:drawjs.tool.HSwap,
	getType:function(){
		return 'swap';
	},
	draw:function(){
		var es = this.states;
		if(es.length>0){
			this.current.clear();
			this.current.moveTo(es[0].x,es[0].y);
		}
		if(es.length>1){
			this.current.lineTo(es[0].x,es[1].y);
			this.current.lineTo(es[1].x,es[1].y);
		}
		if(es.length>2){
			this.current.lineTo(es[1].x,es[2].y);
		}
	}
});


drawjs.tool.PathTemplate = new Class({
	Extends:drawjs.tool.Template,
	init:function(){
		var self = this;
		this.controlLayer = new drawjs.Layer({system:true});
		var pointStyle = {
			'fill':'#fff','stroke':'#000',
			'lineWidth':1,'width':8,'height':8,
			'x':-10,'y':-10
		};
		var cPointStyle = {
			'fill':'#fff','stroke':'#000',
			'lineWidth':1,'width':6,'height':6,
			'x':-10,'y':-10
		};
		var cLineStyle = {
			'stroke':'#000','lineWidth':1
		};
		this.controlLine1 = new drawjs.shape.Path(cLineStyle);
		this.controlLine1.moveTo(-167,-167);
		this.controlLine1.lineTo(-67,-67);
		this.controlLine2 = new drawjs.shape.Path(cLineStyle);
		this.controlLine2.moveTo(-167,-167);
		this.controlLine2.lineTo(-67,-67);
		this.controlPoint1 = new drawjs.shape.Ellipse(cPointStyle);
		this.controlPoint2 = new drawjs.shape.Ellipse(cPointStyle);
		this.startPoint = new drawjs.shape.Rect(pointStyle);
		this.endPoint = new drawjs.shape.Rect(pointStyle);
		
		this.controlLayer = new drawjs.Layer({system:true,visible:false});
		this.controlLayer.add(this.controlLine1);
		this.controlLayer.add(this.controlLine2);
		this.controlLayer.add(this.controlPoint1);
		this.controlLayer.add(this.controlPoint2);
		this.controlLayer.add(this.startPoint);
		this.controlLayer.add(this.endPoint);
		
		this.reverse = false;
		this.action = false;
		this.current = null;
	},
	select:function(){
		var selected = this.selection.getSelected();
		if(selected.length>0 && selected.getLast().getType()=='path' 
		&& selected.getLast().count()>0){
			this.current = selected.getLast();
			this.refresh();
		}else{
			this.deselect();
		}
	},
	deselect:function(e){
		this.current = null;
		this.action = false;
		this.refresh();
	},
	change:function(){
		this.refresh();
	},
	enter:function(){
		this.canvas.push(this.controlLayer);
		this.select();
		this.refresh();
	},
	leave:function(){
		if(this.action)
			this.current.setVisible(false);
		this.canvas.pop(this.controlLayer);
	},
	mousemove:function(e){
		switch (this.controlLayer.select(e.x,e.y)){
			case this.startPoint:
				this.startPoint.set({fill:'#f00'}); 
			break;
			case this.endPoint: 
				this.endPoint.set({fill:'#f00'}); 
			break;
			default: 
				this.startPoint.set({fill:'#fff'}); 
				this.endPoint.set({fill:'#fff'}); 
			break;
		}
	},
	refresh:function(){
		if(this.current){
			this.controlLayer.setVisible(true);
			this.startPoint.setVisible(!this.action);
			this.endPoint.setVisible(!this.action);
			this.controlPoint1.setVisible(!this.action);
			this.controlPoint2.setVisible(!this.action);
			var sp = this.current.getStartPoint();
			var ep = this.current.getEndPoint();
			
			this.startPoint.setPosition(sp.x-4,sp.y-4);
			this.endPoint.setPosition(ep.x-4,ep.y-4);
			
			var x = this.reverse ? sp.x : ep.x;
			var y = this.reverse ? sp.y : ep.y;
			
			this.controlPoint1.setPosition(x-3,y-3);
			this.controlPoint2.setPosition(x-3,y-3);
			this.controlLine1.setStartPoint(x,y);
			this.controlLine1.setEndPoint(x,y);
			this.controlLine2.setStartPoint(x,y);
			this.controlLine2.setEndPoint(x,y);
		}else{
			this.controlLayer.setVisible(false);
		}
	},
	setCPoint2:function(x,y){
		this.controlPoint2.setVisible(true);
		this.controlPoint2.setPosition(x-3,y-3);
		this.controlLine2.setEndPoint(x,y);
	},
	setCPoint1:function(x,y){
		this.controlPoint1.setVisible(true);
		this.controlPoint1.setPosition(x-3,y-3);
		this.controlLine1.setEndPoint(x,y);
	}
});

drawjs.tool.Pen = new Class({
	Extends:drawjs.tool.PathTemplate,
	getType:function(){
		return 'pen';
	},
	mousedown:function(e){
		this.parent(e);
		this.pressed = true;
		this.dragged = false;
		
		this.focus = this.controlLayer.select(e.x,e.y);
		
		if(this.focus!=this.startPoint && this.focus!=this.endPoint){
			this.current = new drawjs.shape.Path(this.styling.get(['fill','stroke','lineWidth']));
			this.current.moveTo(e.x,e.y);
			this.canvas.getFocus().add(this.current);
			this.selection.select(this.current);
		}
		
		this.action = true;
		this.refresh();
		this.reverse = this.focus==this.startPoint;
	},
	mousemove:function(e){
		this.parent(e);
		if(this.pressed){
			this.dragged = true;
			this.current.lineTo(e.x,e.y,this.reverse);
		}
	},
	mouseup:function(e){
		this.parent(e);
		if(this.pressed){
			this.pressed = false;
			this.action = false;
			if(this.dragged){
				this.history.save(new drawjs.record.Shape(this.current));
			}else{
				//this.selection.deselect();
				this.canvas.getFocus().remove(this.current);
			}
			this.refresh();
		}
		
	}
});

drawjs.tool.Curves = new Class({
	Extends:drawjs.tool.PathTemplate,
	getType:function(){
		return 'curves';
	},
	deselect:function(){
		this.parent();
		this.sketch = false;
	},
	mousedown:function(e){
		this.parent(e);
		this.pressed = true;
		this.dragged = false;
		this.focus = this.controlLayer.select(e.x,e.y);
		this.refresh();
		
		this.x = e.x;
		this.y = e.y;
		
		if(this.sketch){
			this.x2 = e.x;
			this.y2 = e.y;
		}else{
			//first down
			if(this.focus!=this.startPoint && this.focus!=this.endPoint){
				this.current = new drawjs.shape.Path(this.styling.get(['fill','stroke','lineWidth']));
				this.current.moveTo(e.x,e.y);
				this.canvas.getFocus().add(this.current);
				//this.selection.select(this.current);
			}
			
			this.finished = false;
			this.reverse = this.focus == this.startPoint;
			this.current.lineTo(e.x,e.y,this.reverse);
			this.action = true;
		}
		this.refresh();
	},
	mousemove:function(e){
		this.parent(e);
		if(this.pressed){
			this.dragged = true;
			
			if(this.sketch){
				//loop drag
				this.current.back(this.reverse);
				this.x2 = e.shift ? this.x : 2*this.x-e.x;
				this.y2 = e.shift ? this.y : 2*this.y-e.y;
				
				this.current.curveTo(this.x1,this.y1,
				this.x2,this.y2,this.x,this.y,this.reverse);
				this.setCPoint2(this.x2,this.y2);
			}
			
			this.setCPoint1(e.x,e.y);
		}else if(this.sketch){
			this.current.back(this.reverse);
			this.current.curveTo(this.x1,this.y1,
			e.x,e.y,e.x,e.y,this.reverse);
		}
	},
	mouseup:function(e){
		this.parent(e);
		if(this.pressed){
			this.pressed = false;
			
			if(this.sketch){
				//loop up
				this.current.back(this.reverse);
				if(this.hasCP1 || this.dragged)
					this.current.curveTo(this.x1,this.y1,
					this.x2,this.y2,this.x,this.y,this.reverse);
				else
					this.current.lineTo(this.x,this.y,this.reverse);
				this.current.lineTo(e.x,e.y,this.reverse);
			}
			
			this.sketch = true;
			this.hasCP1 = this.dragged;
			this.x1 = e.x;
			this.y1 = e.y;
		}
	},
	dblclick:function(e){
		this.current.back(this.reverse);
		this.finish();
	},
	finish:function(){
		this.sketch = false;
		this.pressed = false;
		this.action = false;
		this.current.back(this.reverse);
		if(this.current.count()>1)
			this.history.save(new drawjs.record.Shape(this.current));
		else
			this.current.setVisible(false);
		this.refresh();
	},
	keydown:function(e){
		switch (e.key){
			case 'enter': this.finish(); break;
			default: break;
		}
	}
});

drawjs.tool.ShapeDragTemplate = new Class({
	Extends:drawjs.tool.Template,
	getShape:function(){},
	enter:function(){
		this.selection.deselect();
	},
	mousedown:function(e){
		this.pressed = true;
		this.dragged = false;
		this.x = e.x; 
		this.y = e.y;
		
		this.focus = this.canvas.select(e.x,e.y);
		this.current = this.getShape();
		this.current.setPosition(e.x,e.y);
		this.current.setSize(1,1);
		this.canvas.getFocus().add(this.current);
		
		this.transform = new drawjs.Transform(this.current);
	},
	mousemove:function(e){
		if(this.pressed){
			this.dragged = true;
			var w = e.x-this.x;
			var h = e.y-this.y;
			if(e.shift){
				var size = Math.min(Math.abs(w),Math.abs(h));
				var unitW = w<0?-1:1;
				var unitH = h<0?-1:1;
				this.transform.setPosition(this.x,this.y);
				this.transform.setSize(	unitW*size,	unitH*size );
			}else if(e.control){
				this.transform.setPosition(this.x-w,this.y-h);
				this.transform.setSize(w*2,h*2);
			}else{
				this.transform.setPosition(this.x,this.y);
				this.transform.setSize(w,h);
			}
		}
	},
	mouseup:function(e){
		if(this.pressed){
			this.pressed = false;
			if(this.dragged){
				//this.selection.select(this.current);
				this.history.save(new drawjs.record.Shape(this.current));
			}else{
				this.current.setVisible(false);
			}
		}
	}
});

drawjs.tool.Rect = new Class({
	Extends:drawjs.tool.ShapeDragTemplate,
	getType:function(){
		return 'rect';
	},
	getShape:function(){
		return new drawjs.shape.Rect(this.styling.get(['fill','stroke','lineWidth']));
	}
});

drawjs.tool.Ellipse = new Class({
	Extends:drawjs.tool.ShapeDragTemplate,
	getType:function(){
		return 'ellipse';
	},
	getShape:function(){
		return new drawjs.shape.Ellipse(this.styling.get(['fill','stroke','lineWidth']));
	}
});

drawjs.tool.HVDottedLine = new Class({
	Extends:drawjs.tool.ShapeDragTemplate,
	getType:function(){
		return 'hVDottedLine';
	},
	getShape:function(){
		return new drawjs.shape.HVDottedLine({
			lineWidth:2,
			stroke:'#f0f'
		});
	}
});

drawjs.tool.HVUnderline = new Class({
	Extends:drawjs.tool.ShapeDragTemplate,
	getType:function(){
		return 'hVUnderline';
	},
	getShape:function(){
		return new drawjs.shape.HVLine({
			lineWidth:2,
			stroke:'#f00'
		});
	}
});

drawjs.tool.Text = new Class({
	Extends:drawjs.tool.ShapeDragTemplate,
	getType:function(){
		return 'text';
	},
	getShape:function(){
		return new drawjs.shape.Rect({
			lineWidth:1,
			stroke:'#000'
		});
	},
	getTextShape:function(){
		return new drawjs.shape.Text(this.styling.get());
	},
	mouseup:function(){
		if(this.pressed){
			this.pressed = false;
			var bound = this.current.getBound();
			this.canvas.getFocus().remove(this.current);
			var text = this.getTextShape();
			text.setPosition(bound.x,bound.y);
			this.canvas.getFocus().add(text);
			if(this.dragged){
				text.setSize(bound.width,bound.height);
			}
			this.selection.select(text);
		}
	}
});


drawjs.Canvas = new Class({
	Implements:Events,
	initialize:function(id){
		var self = this;
		
		this.id = id;
		this.ctx = $(this.id).getContext('2d');
		
		this.layers = [];
		this.index = 0;
		
		//init Events
		this.changed = true;
		var render = function(){
			if(self.changed){
				self.render();
				self.fireEvent('render');
				self.changed = false;
			} 
		}.periodical(30);
		this.layerChange = function(){
			self.changed = true;
		}
		
	},
	getId:function(){
		return this.id;
	},
	getPosition:function(){
		return $(this.id).getPosition();
	},
	setSize:function(w,h){
		$(this.id).width = w;
		$(this.id).height = h;
		this.layers.each(function(layer){
			layer.setSize(w,h);
		});
		this.changed = true;
	},
	getSize:function(){
		return {
			width:$(this.id).width,
			height:$(this.id).height
		}
	},
	setCursor:function(cursor){
		$(this.id).setStyle('cursor',cursor || 'default');
	},
	setFocus:function(layer){
		var index = this.layers.indexOf(layer);
		if(index!=-1) 
			this.index = index;
		return this.index;
	},
	getFocus:function(){
		return this.layers[this.index];
	},
	add:function(layer,index){
		this.index = index || this.index+1;
		this.layers.splice(this.index,0,layer);
		
		layer.addEvent('change',this.layerChange);
		var size = this.getSize();
		layer.setSize(size.width,size.height);
		this.changed = true;
	},
	push:function(layer){
		this.layers.push(layer);
		
		layer.addEvent('change',this.layerChange);
		var size = this.getSize();
		layer.setSize(size.width,size.height);
		this.changed = true;
	},
	pop:function(){
		var layer = this.layers.pop();
		layer.removeEvent('change',this.layerChange);
		this.changed = true;
		return layer;
	},
	remove:function(layer){
		layer.removeEvent('change',this.layerChange);
		this.changed = true;
		this.layers.erase(layer);
	},
	swap:function(layer1,layer2){
		var i1 = this.layers.indexOf(layer1);
		var i2 = this.layers.indexOf(layer2);
		if(i1!=-1 && i2!=-1){
			var temp = this.layers[i1];
			this.layers[i1] = this.layers[i2];
			this.layers[i2] = temp;	
		}
	},
	select:function(x,y){
		for(var i = this.layers.length-1;i>=0;i--){
			var layer = this.layers[i];
			if(layer.isVisible() && !layer.isLocked() && !layer.isSystem()){
				var selected = layer.select(x,y);
				if(selected) return selected;	
			}
		}
		return null;
	},
	bound:function(bound){
		var bounded = [];
		this.layers.each(function(layer){
			if(layer.isVisible() && !layer.isLocked() && !layer.isSystem())
				bounded.append(layer.bound(bound));
		});
		return bounded;
	},
	selectAll:function(){
		
	},
	render:function(){
		var self = this;
		this.layers.each(function(layer){
			if(layer.isVisible()) layer.render(self.ctx);
		});
	}
});

(function(){

var count = 0;

drawjs.Layer = new Class({
	Implements:[Options,Events],
	options:{
		name:'',
		visible:true,
		locked:false,
		system:false
	},
	initialize:function(options){
		this.setOptions(options);
		this.id = count;
		this.$cache = new Element('canvas');
		this.cacheCtx =  this.$cache.getContext('2d');
		this.isCached = false;
		count++;
		
		this.shapes = [];
		
		var self = this;
		this.shapeChange = function(shape){
			self.fireEvent('change',self);
		}
		this.cacheChange = function(shape){
			self.isCached = false;
		}
	},
	setSize:function(w,h){
		this.$cache.width = w;
		this.$cache.height = h;
	},
	getId:function(){
		return this.id;
	},
	setName:function(name){
		this.options.name = name;
	},
	getName:function(){
		return this.options.name;
	},
	setVisible:function(visible){
		this.options.visible = visible;
	},
	isVisible:function(){
		return this.options.visible;
	},
	setLocked:function(locked){
		this.options.locked = locked;
	},
	isLocked:function(){
		return this.options.locked;
	},
	isSystem:function(){
		return this.options.system;
	},
	add:function(shape){
		this.push(shape);
	},
	remove:function(shape){
		for(var i = this.shapes.length-1;i>=0;i--){
			if(shape==this.shapes[i]){
				this.shapes.splice(i,1);
				shape.removeEvent('change',this.shapeChange);
				shape.removeEvent('change',this.cacheChange);
				this.shapeChange(shape);
				break;
			}
		}
	},
	push:function(shape){
		if(this.shapes.length>0){
			var prevShape = this.shapes.getLast();
			if(this.isCached){
				this.shapeRender(prevShape,this.cacheCtx);
			}
			prevShape.addEvent('change',this.cacheChange);
		}
		this.shapes.push(shape);
		shape.addEvent('change',this.shapeChange);
		
		this.shapeChange(shape);
	},
	pop:function(){
		var shape = this.shapes.pop();
		shape.removeEvent('change',this.shapeChange);
		shape.removeEvent('change',this.cacheChange);
		
		this.shapeChange(shape);
		return shape;
	},
	select:function(x,y){
		var test = function(shape){
			if(!shape.isVisible()) return false;
			
			var s = shape.getBound();
			return y>=s.y && y<=s.y + s.height 
			&& x>=s.x && x<=s.x + s.width;
		}
		for(var i=this.shapes.length-1;i>=0;i--){
			var shape = this.shapes[i];
			if(test(shape)) return shape;
		}
		return null;
	},
	bound:function(t){
		return this.shapes.filter(function(shape){
			if(!shape.isVisible()) return false;
			
			var s = shape.getBound();
			return s.x>=t.x && s.y>=t.y
			&& s.x + s.width <= t.x + t.width
			&& s.y + s.height <= t.y + t.height;
		});
	},
	shapeRender:function(shape,ctx){
		if(shape.isVisible()){
			ctx.save();
			shape.render(ctx);
			ctx.restore();
		}
	},
	render:function(ctx){
		var len = this.shapes.length;
		if(!this.isCached){
			//this.$cache.width++; this.$cache.width--;
			this.cacheCtx.clearRect(0,0,this.$cache.width,this.$cache.height);
			if(len>1){
				for(var i=0;i<len-1;i++){
					this.shapeRender(this.shapes[i],this.cacheCtx);
				}
			}
			this.isCached = true;
		}
		if(len>1) ctx.drawImage(this.$cache,0,0);
		if(len>0) this.shapeRender(this.shapes.getLast(),ctx);
		
	}
});

})();


drawjs.shape = {};

(function(){

var count = 0;

drawjs.shape.Template = new Class({
	Implements:[Options,Events],
	options:{visible:true},
	initialize:function(data){
		this.id = count;
		count++;
		
		this.init();
		this.set(data);
	},
	init:function(){},
	getId:function(){
		return this.id;
	},
	getType:function(){},
	fireChange:function(){
		this.fireEvent('change',this);
	}.protect(),
	set:function(data){
		this.setOptions(data);
		this.fireChange();
	},
	get:function(types){
		var self = this;
		if(!types || types.length==0)
			return Object.clone(this.options);
		else{
			var subset = {};
			Array.from(types).each(function(type){
				if(self.options[type])
					subset[type] = self.options[type];
			});
			return subset;
		}
	},
	setVisible:function(visible){
		this.set({visible:visible});
	},
	isVisible:function(){
		return this.options.visible;
	},
	flipX:function(){
		this.set({flipX:!this.options.flipX});
	},
	flipY:function(){
		this.set({flipY:!this.options.flipY});
	},
	setPosition:function(x,y){
		this.set({x:x,y:y});
	},
	setSize:function(width,height){
		this.set({
			width:Math.max(0,width),
			height:Math.max(0,height)
		});
	},
	getBound:function(){
		var o = this.options;
		return {x:o.x,y:o.y,width:o.width, height:o.height};
	},
	render:function(ctx){
		var o = this.options;
		if(o.fill) ctx.fillStyle = o.fill;
		if(o.stroke) ctx.strokeStyle = o.stroke;
		if(o.lineWidth) ctx.lineWidth = o.lineWidth;
	},
	clone:function(){
		return new drawjs.shape[this.getType().capitalize()](this.get());
	}
});

})();

drawjs.shape.HVLine = new Class({
	Extends:drawjs.shape.Template,
	render:function(ctx){
		this.parent(ctx);
		var o = this.options;
		
		var c = (o.lineWidth||1)%2/2;
		var width = (o.width>o.height?o.width:0);
		var height = (o.height>o.width?o.height:0);
		var x = (o.x||0) + (o.flipX && width==0 ?o.width||0:0)-c;
		var y = (o.y||0) + (o.flipY && height==0 ?o.height||0:0)-c;
		
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.lineTo(x+width,y+height);
		if(o.fill) ctx.fill();
		if(o.stroke) ctx.stroke(); 
		ctx.closePath();
	},
	getType:function(){
		return 'hVLine';
	}
});

drawjs.shape.Image = new Class({
	Extends:drawjs.shape.Template,
	set:function(data){
		var self = this;
		if(data.src){
			if(this.$img){
				//clear $img
				this.$img.destroy();
				this.loaded = false;
				this.width = null;
				this.height = null;
			}
			//load new $img
			this.$img = new Element('img');
			this.$img.addEvent('load',function(){
				this.inject(document.body);
				self.loaded = true;
				self.width = this.getSize().x;
				self.height = this.getSize().y;
				self.fireEvent('change',this);
				self.fireEvent('load',this);
				this.setStyle('display','none');
			});
			this.$img.set('src',data.src);
		}
		this.parent(data);
	},
	render:function(ctx){
		var b = this.getBound();
		
		if(this.loaded){
			ctx.drawImage(this.$img,b.x,b.y,b.width,b.height);
			
		}
	},
	getBound:function(){
		var o = this.options;
		return {
			x:o.x || 0,
			y:o.y || 0,
			width:o.width || this.width || 0,
			height:o.height || this.height || 0
		}
	},
	getType:function(){
		return 'image';
	}
	
});

drawjs.shape.HVDottedLine = new Class({
	Extends:drawjs.shape.Template,
	render:function(ctx){
		this.parent(ctx);
		var o = this.options;
		var width = o.width>o.height?o.width:0;
		var height = o.height>o.width?o.height:0;
		var x = (o.x||0) + (o.flipX && width==0?o.width||0:0);
		var y = (o.y||0) + (o.flipY && height==0?o.height||0:0);
		
		var radius = (o.lineWidth.toInt()+1)||2;
		var space = radius*3+1;
		var len = Math.sqrt(width*width + height*height)/space;
		var spaceX = width/len;
		var spaceY = height/len;
		
		ctx.beginPath();
		for(var i=0;i<=len;i++){
			var dotX = x+i*spaceX;
			var dotY = y+i*spaceY;
			ctx.moveTo(dotX+radius,dotY);
			ctx.arc(dotX, dotY, radius, 0, Math.PI*2, true); 
		}
		if(o.fill) ctx.fill();
		if(o.stroke) ctx.stroke(); 
		ctx.closePath();
	},
	getType:function(){
		return 'hVDottedLine';
	}
})



drawjs.shape.Rect = new Class({
	Extends:drawjs.shape.Template,
	flipX:function(){},
	flipY:function(){},
	render:function(ctx){
		this.parent(ctx);
		var o = this.options;
		var c = (o.lineWidth||1)%2/2;
		var x = Math.round(o.x||0)+c;
		var y = Math.round(o.y||0)+c;
		var width = Math.round(o.width||0)-c*2;
		var height = Math.round(o.height||0)-c*2;
		var radius = Math.min(o.radius || 0,Math.min(width/2,height/2));
		
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		
		if(o.fill) ctx.fill();
		if(o.stroke) ctx.stroke();
	},
	getType:function(){
		return 'rect';
	}
});

drawjs.shape.Ellipse = new Class({
	Extends:drawjs.shape.Template,
	flipX:function(){},
	flipY:function(){},
	render:function(ctx){
		this.parent(ctx);
		var o = this.options;
		var c = (o.lineWidth||1)%2/2;
		var x = (o.x||0)-c; 
		var y = (o.y||0)-c; 
		var w = o.width||0;	
		var h = o.height||0;
		var kappa = .5522848;
		var ox = (w / 2) * kappa; 
		var oy = (h / 2) * kappa;
		var xe = x + w;	
		var ye = y + h;
		var xm = x + w / 2;	
		var ym = y + h / 2;
		
		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
		if(o.fill) ctx.fill();
		if(o.stroke) ctx.stroke();
	},
	getType:function(){
		return 'ellipse';
	}
});


(function(){

var testCtx = null;

drawjs.shape.Text = new Class({
	Extends:drawjs.shape.Template,
	init:function(){
		this.set({
			fontSize:25,
			fontFamily:'Arial',
			lineHeightEm:1.2,
			textAlign:'left',
			textVAlign:'top',
			text:''
		}); 
	},
	getType:function(){
		return 'text';
	},
	flipX:function(){},
	flipY:function(){},
	set:function(data){
		this.parent(data);
		
		var self = this;
		var o = this.options;
		var size = this.options.fontSize*this.options.lineHeightEm;
		
		testCtx = testCtx || new Element('canvas').getContext('2d');
		testCtx.font = this.options.fontSize+'px '+this.options.fontFamily;
		
		this.lines = [];
		this.spaceWidth = testCtx.measureText(' ').width;
        Array.each(this.options.text.split(/\r\n|\r|\n/),function(text){
			var start = 0;
			var end = 0;
			var isSpace = false;
			for (var i = 0, len = text.length; i < len; i++) {
				var code = text.charCodeAt(i); 
				var chr = text.charAt(i);
				
				if (chr==' ' || code>127){
					end = i;
					isSpace = code < 128; 
					//isSpace = non chinese char
				};
				if (testCtx.measureText(text.substring(start,i)).width 
					>= (self.options.width || 166667)) {
					self.lines.push(text.substring(start,end));
					start = isSpace ? end+1 : end;
					end = start;
				}
			};
			self.lines.push(text.substring(end,i));
		});
	},
	getBound:function(){
		return {
			x:this.options.x || 0,
			y:this.options.y || 0,
			width:this.options.width || this.width || 0,
			height:this.options.height || this.height || 0
		}
	},
	render:function(ctx){
		if(this.options.text=='') return;
		
		var self = this;
		var o = this.options;
		
		if(o.textFill) ctx.fillStyle = o.textFill;
		if(o.textStroke) ctx.strokeStyle = o.textStroke;
		if(o.lineWidth) ctx.lineWidth = o.lineWidth;
		
		ctx.textBaseline = "top";
		ctx.font = o.fontSize+'px '+o.fontFamily;
		ctx.textAlign = o.textAlign;
		
		var bound = this.getBound();
		var size = o.fontSize*o.lineHeightEm;
		switch(o.textAlign){
			case 'center': var initX = bound.x + bound.width/2; break;
			case 'right': var initX = bound.x + bound.width; break;
			default: var initX = bound.x; break;
		}
		var vSpace = Math.max(bound.height-this.lines.length*size,0);
		switch(o.textVAlign){
			case 'center': var initY = bound.y + vSpace/2; break;
			case 'bottom': var initY = bound.y + vSpace; break;
			default: var initY = bound.y; break;
		}
		for(var i=0,l=this.lines.length;i<l;i++){
			var line = this.lines[i];
			var x = initX;
			var y = initY + size*i;
			if(bound.height > 0 && y+size > bound.y + bound.height) break;
			if(o.textFill) ctx.fillText(line, x, y);
			if(o.textStroke) ctx.strokeText(line, x, y);
		}
	}
});

drawjs.shape.VText = new Class({
	Extends:drawjs.shape.Template,
	getType:function(){
		return 'vText';
	},
	init:function(){
		this.set({
			fontSize:25,
			fontFamily:'Arial',
			lineHeightEm:1.2,
			text:''
		}); 
	},
	render:function(){
	}

});


})();



drawjs.shape.HInsertText = new Class({
	Extends:drawjs.shape.Template,
	getType:function(){
		return 'hInsertText';
	},
	init:function(){
		var self = this;
		this.text = new drawjs.shape.Text({
			fontFamily:'Arial',
			textAlign:'left',
			textVAlign:'top',
			textFill:'#f00',
			fontSize:20
		});
		this.path = new drawjs.shape.Path({
			fill:'#f00',
			stroke:'rgba(255, 0, 0, 0.7)',
			lineWidth:3
		});
		this.path.moveTo();
		this.path.lineTo();
		this.path.lineTo();
		this.addEvent('change',function(){
			var o = self.options;
			var options = {};
			if(o.x) options.x = o.x+10;
			if(o.y) options.y = o.y+10;
			if(o.width) options.width = o.width-10;
			if(o.height) options.height = o.height-10;
			if(o.text) options.text = o.text;
			if(o.fontSize) options.fontSize = o.fontSize;
			self.text.set(options);
		});
	},
	getBound:function(){
		var textBound = this.text.getBound();
		console.log(textBound);
		return {
			x:this.options.x,
			y:this.options.y,
			width:textBound.width+10,
			height:textBound.height+10
		}
	},
	render:function(ctx){
		var o = this.options;
		var x = o.x||0;
		var y = o.y||0;
		var width = o.width||0;
		var height = o.height||0;
		ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(x,y+10);
		ctx.lineTo(x+40,y);
		ctx.lineTo(x+80,y+10);
		ctx.stroke();
		ctx.closePath();
		this.text.render(ctx);
	}
});

drawjs.shape.EllipseText = new Class({
	Extends:drawjs.shape.Template,
	getType:function(){
		return 'ellipseText';
	},
	init:function(){
		var self = this;
		this.text = new drawjs.shape.Text({
			fontFamily:'Arial',
			textAlign:'left',
			textVAlign:'top',
			textFill:'#0f0',
			fontSize:30,
			x:0,y:0
		});
		this.ellipse = new drawjs.shape.Ellipse({
			x:0,y:0,width:1,height:1,
			stroke:'#0f0',
			lineWidth:4
		});
		this.addEvent('change',function(){
			var o = self.options;
			var oText = {};
			var oEllipse = {};
			if(o.text){
				oText.text = o.text;
			}
			
			if(o.x || o.width){
				oText.x = o.x+o.width-35;
				oEllipse.x = o.x;
				oEllipse.width = o.width-30;
			}
			if(o.y || o.height){
				oText.y = o.y-5;
				oEllipse.y = o.y;
				oEllipse.height = o.height;
			}
			self.ellipse.set(oEllipse);
			self.text.set(oText);
		});
	},
	render:function(ctx){
		this.ellipse.render(ctx);
		this.text.render(ctx);
	}
});

drawjs.shape.TextRect = new Class({
	Extends:drawjs.shape.Rect,
	Implements:drawjs.shape.Textable,
	init:function(){
		this.textInit();
		/*
		this.set({
			text:'Diu Diu Diu',
			textFill:'#000',
			textAlign:'center'
		})
		*/;
	},
	getType:function(){
		return 'textRect';
	},
	render:function(ctx){
		this.parent(ctx);
		this.textRender(ctx);
	}
});


(function(){

var approxCurve = function(points,count){
	var getPointAt = function(points,at){
		if(points.length==1){
			return points[0];
		}else{
			var newPoints = [];
			var len = points.length-1;
			for(var i=0;i<len;i++){
				var r = at/count;
				newPoints.push({
					x:points[i].x+(points[i+1].x-points[i].x)*r,
					y:points[i].y+(points[i+1].y-points[i].y)*r
				});
			}
			return getPointAt(newPoints,at);
		}
	}
	var curve = [];
	for(var i=0;i<=count;i++)
		curve.push(getPointAt(points,i));
	return curve;
}

drawjs.shape.Path = new Class({
	Extends:drawjs.shape.Template,
	init:function(){
		this.hasAnalyzed = false;
		this.x = null;
		this.y = null;
		this.width = null;
		this.height = null;
		this.options.path = [];
	},
	getType:function(){
		return 'path';
	},
	setPosition:function(x,y){
		var self = this;
		if(!this.hasAnalyzed) this.analyze();
		var dx = x-this.x; 
		var dy = y-this.y;
		
		this.options.path.each(function(l){
			l.each(function(pt,i){
				if(i>0){
					pt.x += dx;
					pt.y += dy;
				}
			});
		});
		this.x = x;
		this.y = y;
		
		this.fireChange();
	},
	setSize:function(width,height){
		//width = Math.max(0.001,width);
		//height = Math.max(0.001,height);
		var self = this;
		if(!this.hasAnalyzed) this.analyze();
		var rx = this.width!=0? width/this.width:1;
		var ry = this.height!=0?height/this.height:1;
		
		this.options.path.each(function(l){
			l.each(function(pt,i){
				if(i>0){
					pt.x = (pt.x - self.x)*rx + self.x;
					pt.y = (pt.y - self.y)*ry + self.y
				}
			});
		});
		this.width = width;
		this.height = height;
		
		this.fireChange();
	},
	analyze:function(){
		var self = this;
		
		var minX = 16667;
		var minY = 16667;
		var maxX = -16667;
		var maxY = -16667;
		
		var minMax = function(pt){
			minX = Math.min(pt.x,minX);
			minY = Math.min(pt.y,minY);
			maxX = Math.max(pt.x,maxX);
			maxY = Math.max(pt.y,maxY);
		}
		var prev = null;
		this.options.path.each(function(l){
			if(l[0]=='C'){
				approxCurve([prev.getLast(),l[1],l[2],l[3]],50).each(minMax);
			}else if(l[0]=='Q'){
				approxCurve([prev.getLast(),l[1],l[2]],50).each(minMax);
			}else{
				minMax(l.getLast());
			}
			prev = l;
		});
		this.x = minX;
		this.y = minY;
		this.width = Math.max(0.1,maxX-minX);
		this.height = Math.max(0.1,maxY-minY);
		this.hasAnalyzed = true;
	},
	flipX:function(){
		var self = this;
		if(!this.hasAnalyzed) this.analyze();
		this.options.path.each(function(l){
			l.each(function(pt,i){
				if(i>0) pt.x = self.width-(pt.x-self.x)+self.x;
			});
		});
		this.fireChange();
	},
	flipY:function(){
		var self = this;
		if(!this.hasAnalyzed) this.analyze();
		this.options.path.each(function(l){
			l.each(function(pt,i){
				if(i>0) pt.y = self.height-(pt.y-self.y)+self.y;
			});
		});
		this.fireChange();
	},
	getBound:function(){
		if(!this.hasAnalyzed) this.analyze();
		return {x:this.x,y:this.y,width:this.width,height:this.height};
	},
	count:function(){
		return this.options.path.length;
	},
	setPointAt:function(i,x,y,isDelta){
		var path = this.options.path;
		
		//todo: H V lines
		
		var pt = path[i].getLast();
		var dx = isDelta ? x: x-pt.x;
		var dy = isDelta ? y: y-pt.y;
		pt.x += dx;
		pt.y += dy;
		
		this.setCPointAt(i,dx,dy,true);
		this.setNextCPointAt(i,dx,dy,true);
		
		this.hasAnalyzed = false;
		this.fireChange();
	},
	setCPointAt:function(i,x,y,isDelta){
		var path = this.options.path;
		if(path[i].length>2){ // has control point
			var pt = path[i][path[i].length-2];
			pt.x = isDelta ? pt.x + x : x;
			pt.y = isDelta ? pt.y + y : y;
			
			this.hasAnalyzed = false;
			this.fireChange();
		}
	},
	setNextCPointAt:function(i,x,y,isDelta){
		var path = this.options.path;
		if(path.length-1>i && path[i+1][0]=='C'){ 
			//next point is cubic curve
			var pt = path[i+1][1];
			pt.x = isDelta ? pt.x + x : x;
			pt.y = isDelta ? pt.y + y : y;
			
			this.hasAnalyzed = false;
			this.fireChange();
		}
	},
	setStartPoint:function(x,y,isDelta){
		this.setPointAt(0,x,y,isDelta);
	},
	setEndPoint:function(x,y,isDelta){
		this.setPointAt(this.count()-1,x,y,isDelta);
	},
	getPointAt:function(i){
		var path = this.options.path;
		if(this.count()>0){
			//todo: h v lines
			return Object.clone(path[i].getLast());
		}else{
			return null;
		}
	},
	getCPointAt:function(i){
		var path = this.options.path;
		return path[i].length>2 ? 
		Object.clone(path[i][ path[i].length-2 ]) : null;
	},
	getNextCPointAt:function(i){
		var path = this.options.path;
		return path.length-1>i && path[i+1][0]=='C' ?
		Object.clone(path[i+1][1]) : null;
	},
	getStartPoint:function(){
		return this.getPointAt(0);
	},
	getEndPoint:function(){
		return this.getPointAt(this.count()-1);
	},
	set:function(data){
		this.parent(data);
		this.hasAnalyzed = false;
	},
	add:function(cmd,mid,pt,reverse){
		var path = this.options.path;
		if(!reverse || path.length==0){
			path.push([].concat(cmd, mid || [],[pt]));
		}else{
			var toPt = path.shift().getLast();
			mid = Array.clone(mid).reverse();
			
			path.unshift([].concat(cmd, mid || [],[toPt]));
			path.unshift(['M',pt]);
		}
		this.hasAnalyzed = false;
		this.fireChange();
	}.protect(),
	moveTo:function(x,y,reverse){
		this.add('M',null,{x:x,y:y},reverse);
	},
	lineTo:function(x,y,reverse){
		this.add('L',null,{x:x,y:y},reverse);
	},
	curveTo:function(x1,y1,x2,y2,x,y,reverse){
		this.add('C',[{x:x1,y:y1},{x:x2,y:y2}],{x:x,y:y},reverse);
	},
	quadraticCurveTo:function(x1,y1,x,y,reverse){
		this.add('Q',[{x:x1,y:y1}],{x:x,y:y},reverse);
	},
	back:function(reverse){
		if(this.count()==0) return;
		
		var path = this.options.path;
		if(!reverse){
			path.pop();
		}else{
			path.shift();
			var pt = path.shift().getLast();
			path.unshift(['M',pt]);
		}
		this.hasAnalyzed = false;
		this.fireChange();
	},
	clear:function(){
		this.options.path.empty();
		this.fireChange();
	},
	render:function(ctx){
		this.parent(ctx);
		
		var self = this;
		var prev = null;
		var o = this.options;
		var c = (o.lineWidth||1)%2/2;
		
		ctx.beginPath();
		o.path.each(function(l){
			switch(l[0]){
				case 'M': ctx.moveTo(l[1].x+c,l[1].y+c); break;
				case 'L': ctx.lineTo(l[1].x+c,l[1].y+c); break;
				case 'C': ctx.bezierCurveTo(l[1].x+c,l[1].y+c,l[2].x+c,l[2].y+c,l[3].x+c,l[3].y+c); break;
				case 'Q': ctx.quadraticCurveTo(l[1].x+c,l[1].y+c,l[2].x+c,l[2].y+c); break;
			}
			prev = l;
		});
		if(o.fill) ctx.fill();
		if(o.stroke) ctx.stroke();
		ctx.closePath();
	}
});

})();