
var wildbook = {
    classNames: [
        'Encounter',
        'MarkedIndividual',
        'SinglePhotoVideo',
        'Measurement',
        'survey_Survey',
        'survey_SurveyTrack',
        'Point',
        'Occurrence',
        'MediaSubmission',
        'media_MediaTag'
    ],

    Model: {},
    Collection: {},

    loadAllClasses: function(callback) {
        this._loadAllClassesCount = this.classNames.length;
        var me = this;
        for (var i = 0 ; i < this.classNames.length ; i++) {
        classInit(this.classNames[i], function() {
            me._loadAllClassesCount--;
//console.log('huh??? %o', me._loadAllClassesCount);
            if (me._loadAllClassesCount <= 0) {
                //console.info('wildbook.loadAllClasses(): DONE loading all classes');
                if (callback) callback();
            }
        });
        }
    },


/*
    fetch: function(cls, arg, callback) {
        if (!cls || !cls.prototype || !cls.prototype.meta) {
            console.error('invalid class %o', cls);
            return;
        }
        var url = cls.prototype.url();
        if (arg) url += '/' + arg;
console.log('fetch() url = ' + url);

        var ajax = {
            url: url,
            success: function(d) {
                if (!(d instanceof Array)) d = [d];
                var arr = [];
                for (var i = 0 ; i < d.length ; i++) {
                    var obj = new cls(d[i]);  //TODO do we need to trap failures?
                    arr.push(obj);
                }
                callback(arr);
            },
            error: function(x,a,b) { callback({error: a+': '+b}); },
            type: 'GET',
            dataType: 'json'
        };
console.log('is %o', ajax);
        $.ajax(ajax);
    },
*/


    // h/t http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
    isValidDate: function(d) {
        if (Object.prototype.toString.call(d) !== "[object Date]") return false;
        return !isNaN(d.getTime());
    },

    //oh the joys of human representation of time (and the inconsistency of browsers implementation of new Date() )
    //note, this returns an actual js Date object.  see below for one which handles a string input and output a little better (e.g. "2001-01" will work)
    parseDate: function(s) {
        s = s.trim();  //some stuff had trailing spaces, ff fails.
        //we need to allow things like just a year (!) or just year-month(!?) ... for sorting purposes.  so:
        if (s.length == 4) s += '-01';  //YYYY -> YYYY-01
        if (s.length == 7) s += '-01';  //YYYY-MM -> YYYY-MM-01
        if (s.length == 10) s += 'T00:00:00';
        //hope we have the right string now -- but wildbook does not put "T" between date/time, which chokes ff and ie(?).
        s = s.substr(0,10) + 'T' + s.substr(11);
        var d = new Date(s);
        if (!this.isValidDate(d)) return false;
        return d;
    },

    //can handle case where is only year or year-month
    flexibleDate: function(s) {
        s = s.trim();
        if (s.length == 4) return s;  //year only
        if (s.length == 7) return s.substr(0,4) + '-' + s.substr(5);  //there is no toLocaleFoo for just year-month.  :(  sorry.
        //now we (should?) have at least y-m-d, with possible time

        var d = this.parseDate(s);
        if (!d) return '';
        return s;
        //i dont think we need to do this, if we "trust" we are y-m-d already!
        return d.toISOString().substring(0,10);
    },


    //TODO should arrays of models be turned into collections?
    //TODO catch recursion, duh?
    toModel: function(obj) {
        if (obj == null) return null;
        if (obj.cid) {  //hacktacular(TODO) but to find out if we are already a model
            return obj;

        } else if ($.isArray(obj) && obj[0] && wildbook.isModelObject(obj[0])) {
            var arr = [];
            var cls;
            for (var i = 0 ; i < obj.length ; i++) {
                arr[i] = wildbook.toModel(obj[i]);
            }
            return arr;

        } else if (cls = wildbook.isModelObject(obj)) {
//console.log('cls = ' + cls);
            if (!wildbook.Model[cls]) {
                console.warn('looks like we dont have a Model for org.ecocean.' + cls + '; returning as plain js object');
                return obj;
            }
            var n = new wildbook.Model[cls](obj);
            n.modelifyProperties();
            return n;

        } else {
            return obj;
        }
    },

    //this returns false if not, short class name if it is
    isModelObject: function(obj) {
        if (!$.isPlainObject(obj)) return false;
        if (!obj.class || (obj.class.indexOf('org.ecocean.') != 0)) return false;
        obj.class.substr(12).replace('.', '_');
    },

    uuid: function() {   //  h/t http://stackoverflow.com/a/2117523/1525311
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
        });
    },

    init: function(callback) {
        classInit('Base', function() { wildbook.loadAllClasses(callback); });  //define base class first - rest can happen any order
    },

		removeFromArray: function(arr, items) {
			if (items.constructor != Array) items = [ items ];
			var n = new Array();
			for (var i = 0 ; i < arr.length ; i++) {
				if (items.indexOf(arr[i]) < 0) n.push(arr[i]);
			}
			return n;
		},

};


function classInit(cname, callback) {
    //console.info('attempting to load class %s', cname);
    $.getScript(wildbookGlobals.baseUrl + '/javascript/classes/' + cname + '.js', function() {
        //console.info('successfully loaded class %s', cname);

        //just a way to get actual name... hacky, but cant figure out the elegant way??
        if (wildbook.Model[cname] && wildbook.Model[cname].prototype) {
            wildbook.Model[cname].prototype.meta = function() {
                return {
                    className: cname
                };
            };
        }
        ////// end hackery

        callback();
    });
}




//$.getScript('/mm/javascript/prototype.js', function() { wildbook.init(); });

//$(document).ready(function() { wildbook.init(); });

