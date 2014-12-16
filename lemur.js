/* lemur.js
 *
 * Ring-tailed list view, native to the central california coast
 * Copyright 2015 Wing Beat It
 *
 */
function behavior(selector, event, fn){
    return {selector: selector, event: event, fn: fn}
}

function lemur(obj){
    var self = this;
    this.render = function(x){
        var jqobj = $(self.view(x));
        jqobj.attr("data-lemur-idx", this.identifier(x));
        return jqobj;
    }

    // "Private"
    this.idxMap = {};
    this.model = [];

    // Parameters
    this.filter = obj.filter || function(){ return true; };
    this.selector = obj.selector;

    this.view = obj.view.bind(this);
    this.identifier = obj.identifier;
    this.sort_comparison = obj.sort_comparison || function(x, y){ return 0; };
    this.auto_scroll = obj.auto_scroll === true;

    this.behaviors = obj.behaviors || []

    var self = this;
    $(document).ready(function(){
        self.rootElement = $(self.selector);
        self.behaviors.map(self.register_behavior.bind(self));
    });
}
lemur.prototype.behavior_wrap = function(jqel, fn){
    var el = jqel;
    if(undefined === jqel.attr("data-lemur-idx")){
        el = $(jqel.parents("[data-lemur-idx]")[0]);
    }
    var idx = el.attr("data-lemur-idx");
    var obj = this.model[this.idxMap[idx]];
    this.behavior_result(fn.bind(this)(el, obj, idx), obj, idx);
}
lemur.prototype.get_element = function(idx){
    return this.rootElement.find("[data-lemur-idx="+idx+"]");
}
lemur.prototype.behavior_result = function(res, obj, idx){
    if(res){
        this.update_object(obj);
    }
}
lemur.prototype.register_behavior = function(bvr){
    var self = this;
    var bvr = bvr;
    var selector = "";
    if(bvr.selector) selector = bvr.selector;
    this.rootElement.on(bvr.event, "[data-lemur-idx] "+selector,
                        function(){
                            self.behavior_wrap.bind(self)($(this), bvr.fn);
                        });
}
lemur.prototype.add_object = function(obj){
    this.add_objects([obj]);
}
lemur.prototype.update_idx_map = function(){
    this.idxMap = {};
    var self = this;
    this.model.map(function(x, index){
        self.idxMap[self.identifier(x)] = index;
    });
}
lemur.prototype.add_objects = function(objects){
    objects = objects.sort(this.sort_comparison);
    var container = $(this.selector);

    // Check if we need to scroll
    var scroll = this.auto_scroll && container[0].scrollTop == container[0].scrollHeight - container[0].clientHeight;

    // Put objects into the list
    var obj_idx = 0;
    var self = this;
    container.children().each(function(index){
        if(obj_idx >= objects.length){ return; }
        var model_obj = self.model[index];
        var objects_obj = objects[obj_idx];

        if(self.sort_comparison(objects_obj, model_obj) < 1){
            // Splice object into the model
            self.model.splice(index, 0, objects_obj);

            //Splice object into the DOM if it meets filter criteria
            if(self.filter(objects_obj)){
                $(this).before(self.render(objects_obj));
            }
            obj_idx++;
        }
    });
    //Append remaining objects into model and DOM
    while(obj_idx < objects.length){
        //Append into the DOM if it meets filter criteria
        if(self.filter(objects[obj_idx])){
            container.append(self.render(objects[obj_idx]));
        }
        //Append into the model
        this.model.push(objects[obj_idx]);
        obj_idx++;
    }
    self.update_idx_map();

    // Scroll if required
    if (scroll) {
        container[0].scrollTop = container[0].scrollHeight - container[0].clientHeight;
    }
}
lemur.prototype.update_object = function(obj){
    this.update_objects([obj]);
}
lemur.prototype.update_objects = function(objects){
    this.model = this.model.concat(objects);
    var container = $(this.selector);
    var self = this;
    objects.map(function(x, obj_idx){
        var dom_obj = container.children("[data-lemur-idx="+self.identifier(x)+"]");
        var new_obj = self.render(x);
        dom_obj.after(new_obj);
        dom_obj.remove();

        //Hide the object if necessary
        if(!self.filter(x)){
            dom_obj.hide();
        }
    });
    self.update_idx_map();
}
lemur.prototype.filter_objects = function(predicate){
    this.filter = predicate;
    var container = $(this.selector);
    var self = this;
    self.model.map(function(x){
        var dom_obj = container.children("[data-lemur-idx="+self.identifier(x)+"]");
        if(!predicate(x)){ dom_obj.hide(); }
        else { dom_obj.show(); }
    });
}
lemur.prototype.add_or_update = function(objects){
    var self = this;
    var new_objects = [];
    objects.map(function(x){
        if(self.identifier(x) in self.idxMap){
            self.update_object(x);
        }
        else {
            new_objects.push(x);
        }
    });
    self.add_objects(new_objects);
}
lemur.prototype.set_objects = function(objects){
    var self = this;
    var new_objects = [];

    var newIdxMap = {};
    for(var idx in objects){
        newIdxMap[this.identifier(objects[idx])] = idx;
    }

    //Delete objects from DOM and model if they're not in the new set of objects
    this.model.map(function(x, idx){
        if(!(self.identifier(x) in newIdxMap)){
            self.model.splice(idx, 1);
            self.get_element(self.identifier(x)).remove();
        }
    });

    this.add_or_update(objects);
}
