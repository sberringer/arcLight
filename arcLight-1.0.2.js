/*
	http://arclight.sberringer.net
	:: JQuery plugin to display either explosions of dots or dotted lines on bezier curves
	
	Requires:	JQuery [tested on 1.4.1, 1.5.1, 1.6.2]
				jquery.paths.js - https://github.com/weepy/jquery.path
	
	Released under the MIT License.
	[Version 1.0.2 -  August 2011] - added option for ending in a different element than the starting one.

	CSS - requires two classes, ".arcs" and ".dot" to define the exploding points or the dotted bezier curve lines. 
	For each set defined with a name, i.e. "arcZ", and determined by the number of classes set in the options (3),
	there should be a CSS class; If CssClasses = 3, then .arcZ1, .arcZ2, .arcZ3.  The code will randomize between the (3) classes.
	
	Known issue:  the first arc or dot gets left behind because it's displayed before it's positioned.
*/
	
(function ($)
{
	$.fn.arcLight = function (options)
	{		
		viewPort = function ()
		{
			var h = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
			var w = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
			h -= 20;
			return { width: w, height: h }
		}

		var display = {
			'beginX1': 0,
			'beginX2': 0,
			'beginY1': 0,
			'beginY2': 0,
			'endX1': 0,
			'endX2': 0,
			'endY1': 0,
			'endY2': 0
		};
		var vport = viewPort();		// default to view port
		display.beginX2 = vport.width;
		display.beginY2 = vport.height;
		display.endX2 = vport.width;
		display.endY2 = vport.height;
		
		var _options = {		// [default settings]
			'Name': 'arcZ',			// name givin to the elements created, should match CSS selector
			'CssClasses': 3,		// number of css classes to randomize and apply to dots
			'InitialDelay': 1000,	// wait this long before running the first sequence
			'Frequency': 5000,		// how often to run an animation sequence
			'SetDurationBegin': 2000,  // lower limit of duration for explosion/dots animation 
			'SetDurationEnd': 4000,	// upper limit of duration for animation
			'Explode': false,		// explosion of dots, or lines
			'NumOfArcs': 6,			// for {Explode == true} we will multiply * 10
			'StartAtEnd': false,	// if true, either explosions or dots will continue from the previous end point
			'EndAtSame': false,     // if true all the dots end in the same location
			'RepLimit': 5,			// each arc will run this number of times, -1 = forever or until the browser gags
			'Display': display,		// calculated display points, based on either element passed in, or viewport
			'UseViewport': true,	// default to using the whole visible window
			'EndContainer': ''		// if not empty, use this for the end point boundries - [1.0.2]
		};
		if (options) { $.extend(_options, options); }

		arc = function ()
		{
			this.index = 0;
			this.name = '';
			this.y = 0;
			this.x = 0;
			this.duration = 0;
			this.executed = 0;
		}

		bezier = function (arc, endx, endy)
		{
			var sx = arc.x;
			var sy = arc.y;
			var i = arc.index;

			var xo = i % 2 ? 1 : -1;  // the negative on every other one sends them circlular

			return new $.path.bezier({
				start: { x: sx, y: sy, angle: i * 10 * xo },
				end: { x: endx, y: endy, angle: i * -10 * xo, length: i / 5.0 }
			});
		}

		randomFromTo = function (from, to)
		{
			return Math.floor(Math.random() * (to - from + 1) + from);
		}
		makeSetofPoints = function (options)
		{
			var startx = randomFromTo(options.Display.beginX1, options.Display.beginX2);    // for a new random starting point
			var starty = randomFromTo(options.Display.beginY1, options.Display.beginY2);

			for (var i = 0; i < options.NumOfArcs; i++)
			{
				var classx = randomFromTo(1, options.CssClasses);
				//$('body').append('<div id="' + options.Name + i + '" class="arcs ' + options.Name + classx + '" style="display: none;"></div>');
				//TODO:  move this down to next function
				$('body').append('<div id="' + options.Name + i + '" class="arcs ' + options.Name + classx + '"></div>');

				var m = new arc();
				m.index = i;
				m.x = startx;
				m.y = starty;
				m.duration = randomFromTo(options.SetDurationBegin, options.SetDurationEnd);
				m.name = options.Name + i;

				$('#' + m.name).data('point', m);
			}
		}

		moveThem = function (options)
		{
			var startx = randomFromTo(options.Display.beginX1, options.Display.beginX2);    // for a new random starting point
			var starty = randomFromTo(options.Display.beginY1, options.Display.beginY2);

			var endx = randomFromTo(options.Display.endX1, options.Display.endX2);   // [end points] put these outside the loop to have them end in the same place
			var endy = randomFromTo(options.Display.endY1, options.Display.endY2);

			for (var i = 0; i < options.NumOfArcs; i++)
			{
				if ((options.Explode == false || options.StartAtEnd == true) && options.EndAtSame == false)
				{
						var endx = randomFromTo(options.Display.endX1, options.Display.endX2);   
						var endy = randomFromTo(options.Display.endY1, options.Display.endY2);
				}

				var m = $('#' + options.Name + i).data('point');
				var name = "#" + options.Name;

				//TODO:  maybe create the div here instead of makePoints()
				$("#" + m.name).animate({ path: bezier(m, endx, endy) },
                    {
                    	duration: m.duration,
                    	step: function (now, fx)		// note:  IE does not call the step function nearly as many times as Chrome/FF
                    	{
                    		if (options.Explode == false)		//TODO: first dot is outside the target area
                    		{
                    			var $elem = $('#' + fx.elem.id);
                    			var point = $elem.offset();
                    			var color = $elem.css('background-color');

                    			var style = "left:" + point.left + "px; top: " + point.top + "px; background-color:" + color + ";";
                    			$('body').append("<span class='dot' style='" + style + "'></span>");
                    		}
                    	},
                    	complete: function ()
                    	{
                    		var point = $(this).data('point');
                    		if (options.StartAtEnd)
                    		{
                    			var x = $(this).offset().left;
                    			var y = $(this).offset().top;
                    			point.x = x;
                    			point.y = y;
                    		}
                    		else
                    		{
                    			point.x = startx;       // set all points to new starting coordinates
                    			point.y = starty;
                    		}
                    		point.executed += 1;
                    		checkForEnd(point, options);
                    	}
                    });
			}
		}

		checkForEnd = function (p, options)
		{
			if (options.RepLimit > 0 && p.executed >= options.RepLimit)
			{
				var intrvl = $('body').data(options.Name);
				clearInterval(intrvl);
			}
		}

		makeAndRun = function (options)
		{
			makeSetofPoints(options);

			setTimeout(function ()
			{
				moveThem(options);

				var intset = setInterval(function ()
				{
					moveThem(options);
				}, options.Frequency);

				$('body').data(options.Name, intset);

			}, options.InitialDelay);
		}
		// plugin entry point /-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/
		return this.each(function ()
		{
			var $elem = $(this);

			if (_options.UseViewport == false)
			{
				var offset = $elem.offset();
				var display = { 
					'beginX1': offset.left, 
					'beginX2': (offset.left + $elem.width()), 
					'beginY1': offset.top, 
					'beginY2': (offset.top + $elem.height()),
					'endX1': offset.left,
					'endX2': (offset.left + $elem.width()),
					'endY1': offset.top,
					'endY2': (offset.top + $elem.height())
				};	
				
				//[1.0.2] - use container for the end points
				if (_options.EndContainer.length > 0)
				{
					var $end = $(_options.EndContainer);
					offset = $end.offset();
					display.endX1 = offset.left;
					display.endX2 = (offset.left + $end.width());
					display.endY1 = offset.top;
					display.endY2 = (offset.top + $end.height());
				}
							
				_options.Display = display;
			}
			if (_options.Explode == true)
				_options.NumOfArcs *= 10;

			makeAndRun(_options);

		}); // end of entry	/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/
		
	};
	
})(jQuery);
