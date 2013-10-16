$(document).ready(function() {
	var canvas_border = parseInt($('canvas.board').css('border-left-width'), 10);
	var socket = io.connect(document.location.href);
	var draw_data = {'color': 'black', 'size': 7, 'scale': 1};
	var write_data = {'color': 'black', 'font_style': '', 'font_weight': '', 'font_size': '20', 'font_family': 'Arial', 'scale': 1};
	var image_data = {};
	var data_points = [];
	var last_point = {};
	var user_data;
	var canvas_offset;
	var leftgap = 0;
	var topgap = 0;
	var rightgap = 0;
	var bottomgap = 0;
	var saved_drawings = {};

	//facebook init
	$.ajaxSetup({ cache: true });
	$.getScript('//connect.facebook.net/en_UK/all.js', function(){
		FB.init({
			appId      : '468916983177004', // App ID
			channelUrl : '//www.cryptic-falls-7546.herokuapp.com//channel.html', // Channel File
			status     : true, // check login status
			cookie     : true, // enable cookies to allow the server to access the session
			xfbml      : true  // parse XFBML
		});

		//retrieves user data when logged into facebook
		FB.Event.subscribe('auth.authResponseChange', function(response){
			console.log(response);
			if (response.status === 'connected') {
				// connected
				if($('.archive').html() === ''){
					socket.emit('fb login', response.authResponse.userID);
				}
			} else if (response.status === 'not_authorized') {
				// not_authorized
			} else {
			// not_logged_in
				logout();
			}
		});
	});

	//Initializers  **remove when sizes are finalized**

	$('.brushes .size').each( function(index){//initialize brush size buttons
		var width = $(this).attr('data-size');
		$(this).css({'width': width + 'px', 'height': width + 'px', 'background': draw_data.color});
	});

	$('.font-sizes .size').each( function(index){//initialize font size buttons
		var pixels = $(this).attr('data-size');
		$(this).css({'font-size': pixels + 'px'});
		$(this).css({'width': pixels + 'px', 'height': pixels + 'px'});
	});

	$('.font').each( function(index){//initialize font buttons
		var font_family = $(this).html();
		$(this).css({'font-family': font_family});
	});

	$('canvas.board').drawRect({
		fillStyle: "#ffffff",
		x: 400, y: 200,
		width: 800, height: 400
	});

	//Tools Events

	//when color is clicked, drawing and writing are now done in that color
	$('.color').click( function(e) {
		e.preventDefault();
		$('.color').removeClass('selected');
		draw_data.color = $(this).addClass('selected').css('background-color');
		write_data.color = draw_data.color;
		$('.brushes .size').css({'background-color': draw_data.color});
		$('.font-sizes').css({'color': draw_data.color});
		$('.text-box textarea').css({'color': draw_data.color});
		if(draw_data.color == 'rgb(255, 255, 255)'){ //handles case where letters are white so that they are visible against background
			$('.font-sizes .size').css({'background-color': 'black'});
		}
		else
		{
			$('.font-sizes .size').css({'background-color': 'white'});
		}
	});

	//sets brush size when clicked
	$('.brushes .size').click( function(e) {
		e.preventDefault();
		$('.brushes .size').removeClass('selected');
		draw_data.size = $(this).addClass('selected').attr("data-size");
	});

	//Text Tools Events

	//sets fontsize when clicked
	$('.font-sizes .size').click( function(e) {
		e.preventDefault();
		$('.font-sizes .size').removeClass('selected');
		write_data.font_size = $(this).addClass('selected').attr("data-size");
		$('.text-box textarea').css({'font-size': write_data.font_size + "px"});
	});

	//sets font when clicked
	$('.font').click( function(e) {
		e.preventDefault();
		$('.font').removeClass('selected');
		write_data.font_family = $(this).addClass('selected').html();
		$('.font-sizes').css({'font-family': write_data.font_family});
		$('.text-box textarea').css({'font-family': write_data.font_family});
	});

	//toggles bold on font when clicked
	$('.bold').click( function(e) {
		e.preventDefault();
		$(this).toggleClass('selected');
		if($(this).hasClass('selected')){
			$('.font-sizes').css({'font-weight': 'bold'});
			$('.text-box textarea').css({'font-weight': 'bold'});
			write_data.font_weight = 'bold';
		}
		else{
			$('.font-sizes').css({'font-weight': 'normal'});
			$('.text-box textarea').css({'font-weight': 'normal'});
			write_data.font_weight = '';
		}
	});

	//toggles italic on font when clicked
	$('.italic').click( function(e) {
		e.preventDefault();
		$(this).toggleClass('selected');
		if($(this).hasClass('selected')){
			$('.font-sizes').css({'font-style': 'italic'});
			$('.text-box textarea').css({'font-style': 'italic'});
			write_data.font_style = 'italic';
		}
		else{
			$('.font-sizes').css({'font-style': 'normal'});
			$('.text-box textarea').css({'font-style': 'normal'});
			write_data.font_style = '';
		}
	});

	//Archive Events

	//saves current drawing locally and to the server
	$('.save').click( function(e){
		e.preventDefault();
		var thumbnail = $('canvas.board').getCanvasImage('jpeg', 0.1);
		console.log({'timestamp': e.timeStamp, 'user': user_data.username, 'data': data_points, 'thumbnail': thumbnail});
		socket.emit('save', {'timestamp': e.timeStamp, 'user': user_data.username, 'data': data_points, 'thumbnail': thumbnail});
	});

	//Upload Events

	//triggers file input
	$('.upload').click(function(e){
		e.preventDefault();
		$('.background-upload>input').trigger('click');
	});

	//automatically uploads image after selected
	$('.background-upload').change(function(e){
		$(this).submit();
	});

	//creates data uri from image and associates it to a new html element
	$('.background-upload').submit(function(e){
		e.preventDefault();
		var file = $('.background-upload input:file').get(0).files[0];
		var src;
		var reader = new FileReader();
		reader.onload = function(e) {
			src = e.target.result;//element can be deleted by user
			$('.uploaded-images').prepend('<form><img src="' + src + '" alt="Uploaded Image"><input type="submit" value="Delete"></form>');
			$('.uploaded-images form').first().show('slow', 'linear').submit( function(e){
				e.preventDefault();
				$(this).hide('slow', 'linear', function(){//deletes element after animation
					$(this).remove();
				});
			}).children('img').mousedown( function(e){//brings up images cursor when clicked
				var offset = $(this).parent().offset();
				var current_image = new Image();
				current_image.onload = function() {
					$('.image-box').css({'width': '168px', 'height': (168 * current_image.height / current_image.width) + 'px'});
					$('.image-box>img').attr('src', src);
				};
				current_image.src = src;
				$('.image-box').css({'top': offset.top, 'left': offset.left }).show().trigger(e);
				e.preventDefault();
			});
		};
		reader.readAsDataURL(file);
	});
	
	//Deletion Events

	//clears canvas
	$('.clear').click( function(e) {
		e.preventDefault();
		data_points = [];
		refresh();
		socket.emit('clear');
	});

	//undos last draw 
	$('.undo').click( function(e) {
		e.preventDefault();
		undo(socket.socket.sessionid);
		socket.emit('undo');
	});

	//Tooltab Events

	//opens and closes toolbars
	$('.tooltab').click( function(e){
		e.preventDefault();
		$('canvas.board').off().on('mousedown', enable_draw);
		if($(this).parent().css('z-index') == 1 && $('.optional-toolbar').hasClass('open') || !$('.optional-toolbar').hasClass('open')){
			$('.optional-toolbar').toggleClass('open');
		}
		$(this).parent().siblings().css('z-index', 0);
		$(this).parent().css('z-index', 1);
	});

	//Tooltab Handlers
	
	//turns on text interface
	//toggles with text_tools_off
	function text_tools_on(e){
		$('canvas.board').off('mousedown', enable_draw).on('click', text_entry);
		$('.font-sizes').show();
		$('.brushes').hide();
		$('.text-box textarea').val('');
		$('.text-box').css({'width': '200px', 'height': '100px'});

		$('.tooltab').on('click', text_tools_off);
		$('.text-tools .tooltab').off('click', text_tools_on);
	}

	//turns off text interface
	//toggles with text_tools_on
	function text_tools_off(e){
		$('canvas.board').off('click', text_entry);
		$('.text-box').hide();
		$('.font-sizes').hide();
		$('.brushes').show();
		$('.text-tools .tooltab').on('click', text_tools_on);
		$('.tooltab').off('click', text_tools_off);
	}

	//toggles with zoom_tools_off
	function zoom_tools_on(e){
		$('.tooltab').on('click', zoom_tools_off);
		$('.zoom_tools .tooltab').off('click', zoom_tools_on);
	}

	//turns off zoom interface
	//toggles with zoom_tools_on
	function zoom_tools_off(e){
		$(this).siblings().removeClass('selected');//unselects all zoom tools
		$('canvas.board').off('mousedown', enable_drag).off('click', zoomIn).off('click', zoomOut);
		$(document).off('mouseup', disable_drag);
		$('.zoom_tools .tooltab').on('click', zoom_tools_on);
		$('.tooltab').off('click', zoom_tools_off);
	}

	//initialized zoom tools and text tools to be switched on
	$('.zoom-tools .tooltab').on('click', zoom_tools_on);
	$('.text-tools .tooltab').on('click', text_tools_on);

	//Text Box and Image Box Handlers

	//sets text cursor to be resizable
	$('.text-box').resizable({
		handles: 'se'
	});

	//changes textbox size to match width of content post wrapping
	$('.text-box textarea').keyup( function(e){
		if($(this)[0].scrollWidth > parseInt($(this).css('width'), 10) + 4){
			$('.text-box').css({'width': $(this)[0].scrollWidth + 'px', 'height': $(this).css('height')});
		}
		if($(this)[0].scrollHeight > parseInt($(this).css('height'), 10) + 4){
			$('.text-box').css({'width': $(this).css('width'), 'height': $(this)[0].scrollHeight + 'px'});
		}
	});
	
	//text box shows submit button when mouseovered
	$('.text-box').hover( function(e){
		$('.text-box input').show(50);
	}, function(e){
		$('.text-box input').hide(100);
	});
	
	//determines drawing parameters and draws text
	//then resets text box
	$('.text-box').submit( function(e){
		e.preventDefault();
		write_data.text = $('.text-box textarea').val();
		write_data.width = $('.text-box textarea').width();
		write_data.id = socket.socket.sessionid;
		draw(write_data);
		draw({'text': "filler", 'id': socket.socket.sessionid});
		socket.emit('draw', write_data);
		socket.emit('draw', {'text': "filler", 'id': socket.socket.sessionid});
		$(this).hide();
		$('.text-box textarea').val('');
		$('.text-box').css({'width': '200px', 'height': '100px'});
	});

	$('.image-box').draggable();
	$('.image-box').resizable({
		handles: 'se'
	});

	//sets parameters for drawing image to canvas and draws to canvas when submitted
	$('.image-box').submit( function(e){
		e.preventDefault();
		var offset = $(this).offset();
		image_data.x = offset.left - canvas_offset.left + 1;
		image_data.y = offset.top - canvas_offset.top + 1;
		image_data.width = $('.image-box>img').width();
		image_data.height = $('.image-box>img').height();
		image_data.src = $('.image-box>img').attr('src');
		image_data.id = socket.socket.sessionid;
		socket.emit('draw', image_data);
		socket.emit('draw', {src: 'filler', id: socket.socket.sessionid});
		draw(image_data);
		$(this).hide();
	});

	//Text Box Handlers

	//constant needed for x,y calc **change to constant when design is finalized**
	var text_box_padding_border_sum = parseInt($('.text-box').css('padding-left'), 10) * 2 + parseInt($('.text-box').css('border-left-width'), 10) * 2;
	//determines textbox location and resizable boundarys when placed
	function text_entry(e){
		write_data.x = e.pageX - canvas_offset.left;
		write_data.y = e.pageY - canvas_offset.top;
		var area_max_width = $('canvas.board').width() - write_data.x - text_box_padding_border_sum;
		var area_max_height = $('canvas.board').height() - write_data.y - text_box_padding_border_sum;
		$('.text-box').resizable('option', {'maxWidth': area_max_width, 'maxHeight': area_max_height});
		$('.text-box').css({'maxWidth': area_max_width, 'maxHeight': area_max_height, 'top': write_data.y + canvas_border, 'left': write_data.x + canvas_border});
		write_data.x = (write_data.x + 3) / write_data.scale + leftgap;
		write_data.y = (write_data.y  + 3) / write_data.scale + topgap;
		$('.text-box').show();
		$('.text-box textarea').focus();
	}
	
	//Zoom Events
		
	//sets canvas to scale larger when clicked and disables other zoom tools
	$('.zoom-in').click( function(e){
		e.preventDefault();
		$(this).toggleClass('selected');
		$(this).siblings().removeClass('selected');
		if($(this).hasClass('selected')){
			$('canvas.board').off().on('click', zoomIn);
			$(document).off();
		}
		else{
			$('canvas.board').off().on('mousedown', enable_draw);
		}
	});

	//sets canvas to scale smaller when clicked and disables other zoom tools
	$('.zoom-out').click( function(e){
		e.preventDefault();
		$(this).toggleClass('selected');
		$(this).siblings().removeClass('selected');
		if($(this).hasClass('selected')){
			$('canvas.board').on('click', zoomOut).off('mousedown', enable_draw).off('click', zoomIn).off('mousedown', enable_drag);
			$(document).off('mouseup', disable_drag);
		}
		else{
			$('canvas.board').off('click', zoomOut).on('mousedown', enable_draw);
		}
	});

	//sets canvas to move when dragged and disables other zoom tools
	$('.drag').click( function(e){
		e.preventDefault();
		$(this).toggleClass('selected');
		$(this).siblings().removeClass('selected');
		if($(this).hasClass('selected')){
			$('canvas.board').on('mousedown', enable_drag).off('mousedown', enable_draw).off('click', zoomOut).off('click', zoomIn);
			$(document).on('mouseup', disable_drag);
		}
		else{
			$('canvas.board').off('mousedown', enable_drag).on('mousedown', enable_draw);
			$(document).off('mouseup', disable_drag);
		}
	});
	
	//resets the canvas to standard zoom when clicked
	$('.reset').click( function(e){
		e.preventDefault();
		$('canvas.board').translateCanvas({
			translateX: (leftgap - rightgap) / 2,
			translateY: (topgap - bottomgap) / 2,
			autosave: false
		});
		$('canvas.board').scaleCanvas({
			x: $('canvas.board').width() / 2, y: $('canvas.board').height() / 2,
			scale: 1 / draw_data.scale,
			autosave: false
		});
		leftgap = 0;
		topgap = 0;
		rightgap = 0;
		bottomgap = 0;
		write_data.scale = draw_data.scale = 1;
		refresh();
	});
	
	//Zoom Handlers
	
	//scales canvas to be larger
	function zoomIn(e){
		var x = (e.pageX - canvas_offset.left) / draw_data.scale; //determines where zoom is centered
		var y = (e.pageY - canvas_offset.top) / draw_data.scale;
		$('canvas.board').scaleCanvas({
			x: x + leftgap, y: y + topgap,
			scale: 1.25,
			autosave: false
		});
		refresh();
		//gaps between border of visible canvas and actual canvas become larger
		leftgap += x * 0.2;
		topgap += y * 0.2;
		rightgap += ($('canvas.board').width() / draw_data.scale - x) * 0.2;
		bottomgap += ($('canvas.board').height() / draw_data.scale - y) * 0.2;
		write_data.scale = draw_data.scale = draw_data.scale * 1.25;
	}
	
	//scales canvas smaller while limiting the actual canvas to be smaller than the visible canvas
	function zoomOut(e){
		if(draw_data.scale > 1){
			var x = (e.pageX - canvas_offset.left) / draw_data.scale;
			var y = (e.pageY - canvas_offset.top) / draw_data.scale;
			
			if(leftgap - x * 0.25 < 0){ //limit zoom out on left boundry
				x = leftgap * 4;
			}
			
			if(topgap - y * 0.25 < 0){ //limit zoomout on top boundry
				y = topgap * 4;
			}
			
			if(rightgap - ($('canvas.board').width() / draw_data.scale - x) * 0.25 < 0){ //limit zoom out on left boundry
				x = $('canvas.board').width() / draw_data.scale - rightgap * 4;
			}
			
			if(bottomgap - ($('canvas.board').height() / draw_data.scale - y) * 0.25 < 0){ //limit zoomout on top boundry
				y = $('canvas.board').height() / draw_data.scale - bottomgap * 4;
			}
			
			$('canvas.board').scaleCanvas({
				x: x + leftgap, y: y + topgap,
				scale: 0.8,
				autosave: false
			});
			refresh();
			//gaps between visible canvas edges and actual canvas edges become smaller
			leftgap -= x * 0.25;
			topgap -= y * 0.25;
			rightgap -= ($('canvas.board').width() / draw_data.scale - x) * 0.25;
			bottomgap -= ($('canvas.board').height() / draw_data.scale - y) * 0.25;
			write_data.scale = draw_data.scale = draw_data.scale * 0.8;
		}
	}
	
	//enables canvas movement based on mouse position
	function enable_drag(e){
		var x = (e.pageX - canvas_offset.left) / draw_data.scale + leftgap;
		var y = (e.pageY - canvas_offset.top) / draw_data.scale + topgap;
		$('canvas.board').on('mousemove', {x: x, y: y}, drag);
	}
	
	//moves the canvas the distance of the change in mouse position while limiting the actual borders of the canvas
	//from coming inside the visible borders
	function drag(e){
		var x = (e.pageX - canvas_offset.left) / draw_data.scale + leftgap;
		var y = (e.pageY - canvas_offset.top) / draw_data.scale + topgap;
		var deltax =  x - e.data.x;
		var deltay =  y - e.data.y;
		//maintains canvas borders
		if(leftgap - deltax < 0){
			deltax = leftgap;
		}
		if(topgap - deltay < 0){
			deltay = topgap;
		}
		if(rightgap + deltax < 0){
			deltax = rightgap * -1;
		}
		if(bottomgap + deltay < 0){
			deltay = bottomgap * -1;
		}
		$(this).translateCanvas({
			translateX: deltax,
			translateY: deltay,
			autosave: false
		});
		leftgap -= deltax;
		topgap -= deltay;
		rightgap += deltax;
		bottomgap += deltay;
		refresh();
	}
	
	function disable_drag(e){
		$('canvas.board').off('mousemove', drag);
	}

	//makes measurements on offset when resized
	$(window).resize( function(e) {
		canvas_offset = $('canvas.board').offset();
		canvas_offset.left = canvas_offset.left + canvas_border;
		canvas_offset.top = canvas_offset.top + canvas_border;
	});
		
	//Drawing Events
	
	// draws a line from previous point to current point
	var draw_to_point = function(e){
		var prevx = draw_data.x;
		var prevy = draw_data.y;
		draw_data.x = (e.pageX - canvas_offset.left) / draw_data.scale + leftgap;
		draw_data.y = (e.pageY - canvas_offset.top) / draw_data.scale + topgap;
		draw_data.id = socket.socket.sessionid;
		socket.emit('draw', draw_data);
		draw_line(draw_data, prevx, prevy);
	};
	
	//draws a starting point and draws lines until mouseup
	var enable_draw = function(e) {
		$('canvas.board').on('mousemove', draw_to_point);
		$(document).on('mouseup', disable_draw);
		draw_data.x = (e.pageX - canvas_offset.left) / draw_data.scale + leftgap;
		draw_data.y = (e.pageY - canvas_offset.top) / draw_data.scale + topgap;
		draw_data.id = socket.socket.sessionid;
		socket.emit('draw', draw_data);
		draw_circle(draw_data);
	};
	
	//stops line drawing and sends data marking end of line
	var disable_draw = function(e) {
		$('canvas.board').off('mousemove', draw_to_point);
		socket.emit('draw',{'id': socket.socket.sessionid});
		$(document).off('mouseup', disable_draw);
	};
	
	//Drawing Handlers

	//will draw something based on type of data
	var draw = function(point){
		if(point.x !== undefined){
			if(point.text !== undefined){
				draw_text(point);
			}
			else if(point.src !== undefined){
				draw_image(point);
			}
			else{
				if(last_point[point.id] === undefined || last_point[point.id].x === undefined){//if beginning of line
					draw_circle(point);
				}
				else{
					draw_line(point, last_point[point.id].x, last_point[point.id].y);
				}
			}
		}
		last_point[point.id] = point;
	};
	
	//draws a circle
	var draw_circle = function(point){
		$('canvas.board').drawArc({
			fillStyle: point.color,
			radius: point.size / 2 / point.scale,
			x: point.x, y: point.y
		});
	};
	
	//draws a line
	var draw_line = function(point, prevx, prevy){
		$('canvas.board').drawLine({
			strokeStyle: point.color,
			strokeWidth: point.size / point.scale,
			rounded: true,
			x1: prevx, y1: prevy,
			x2: point.x, y2: point.y
		});
	};
	
	//draws an image
	var draw_image = function(image){
		$('canvas.board').drawImage({
			'source': image.src,
			'x': image.x,
			'y': image.y,
			'width': image.width,
			'height': image.height,
			'fromCenter': false
		});
	};

	//draws text
	function draw_text(paragraph){
		$("canvas.board").drawText({
			fillStyle: paragraph.color,
			strokeWidth: 0,
			x: paragraph.x, y: paragraph.y, // 3=textareaborder+textareapadding
			font: paragraph.font_style + ' ' + paragraph.font_weight + ' ' + (paragraph.font_size / paragraph.scale) + 'px ' + paragraph.font_family,
			text: paragraph.text,
			fromCenter: false,
			align: 'left',
			maxWidth: paragraph.width / paragraph.scale
		});
	}
	
	//Deletion functions
	
	//undoes last action taken by given user
	var undo = function(userid){
		var i = data_points.length - 1;
		while(i >= 0 && (data_points[i].x !== undefined || data_points[i].id != userid)){//look for the "endpoint"
			i--;
		}

		if(i >= 0 && data_points[i].x === undefined){ //if current data point is an "endpoint"
			data_points.splice(i,1);							//delete it
			i--;
		}

		while(i >= 0 && (data_points[i].x !== undefined || data_points[i].id != userid)){//delete all related points until next "endpoint"
			if(data_points[i].id == userid){
				data_points.splice(i,1);
			}
			i--;
		}
		refresh();
	};
	
	//refresh canvas with given data or curr data
	var refresh = function(data){
		var i;
		data = typeof data !== 'undefined' ? data : data_points;
		$('canvas.board').clearCanvas();
		$('canvas.board').drawRect({//draw background
			fillStyle: "#ffffff",
			x: 400, y: 200,
			width: 800, height: 400
		});
		for(i = 0; i < data.length; i++){//draw each datapoint
			draw(data[i]);
		}
	};

	//Drawing Archive Handlers

	//loads specified drawing
   function load_drawing(e){
		e.preventDefault();
		data_points = saved_drawings[$(this).data('timestamp')].data;
		socket.emit('load', user_data.username + ':' + $(this).data('timestamp'));
		refresh();
   }

   //deleted drawing from local and server storage
   function delete_drawing(e){
		e.preventDefault();
		$(this).hide('slow', 'linear', function(){
			$(this).remove();
		});
		saved_drawings[$(this).data('timestamp')] = undefined;
		socket.emit('delete', user_data.username + ':' + $(this).data('timestamp'));
   }
	
	//Login/out Events

	//validate given user
	$('.login').on('submit', function(e){
		e.preventDefault();
		socket.emit('login', {username: $('.login>input[type="text"]').val(), password: $('.login>input[type="password"]').val()});
	});
	
	//signs up new user if given username and password
	$('.login-dialog input[value="Sign Up"]').on('click', function(e){
		e.preventDefault();
		var username = $('.login>input[type="text"]').val();
		var password = $('.login>input[type="password"]').val();
		if(username === '' || password === ''){
			alert('Please provide both username and password for sign up.');
		}
		else{
			socket.emit('sign up', {username: username, password: password});
		}
	});

	//closes login dialog
	$('.login-dialog .close').on('click', function(e){
		$('.login-dialog').hide();
	});
	
	// opens login dialog
	$('.mini-login').on('click', function(e){
		$('.login-dialog').show();
	});

		// fb login. handling is done in subscription above
	$('.fb-login-button').click( function(e){
		FB.login(function(response) {
			if (response.authResponse) {
				// connected
				console.log('fblogin success');
			}else {
				// cancelled
				console.log('fblogin failure');
			}
		});
	});

	// logs out fb or normal
	$('.logout').click( function(e){
		FB.getLoginStatus(function(response) {
			if (response.status === 'connected') {
				// connected
				FB.logout(function(response){
				});
			}else {
				logout();
			}
		});
	});

	//Login/out handlers

	//clears data and shows login button
	function logout(){
		user_data = undefined;
		saved_drawings = {};
		$('.logout').hide();
		$('.mini-login').show();
		$('.archive').html('');
	}

	// Socket IO
	
	//draws any point and stores it
	socket.on('draw', function(point){
		if(point.id != socket.socket.sessionid){
			draw(point);
		}
		data_points.push(point);
	});
	
	//resets canvas to given data
	socket.on('refresh', function(data){
		data_points = data;
		refresh();
	});

	//undoes last action of given user
	socket.on('undo', function(userid){
		undo(userid);
	});
	
	//clears canvas
	socket.on('clear', function(){
		data_points = [];
		refresh();
	});
	
	//stores given user data and shows logout
	socket.on('login', function(data){
		user_data = data;
		$('.mini-login').hide();
		$('.logout').show();
		$('.login-dialog').hide();
	});
	
	//alerts user of invalid login
	socket.on('invalid login', function(){
		alert('Username and/or password is invalid.');
	});

	//stores given drawings and displays them 
	socket.on('store drawings', function(drawings_to_add){
		var i;
		for(i=0;i<drawings_to_add.length;i++){
			var current_drawing = drawings_to_add[i]; //change thumbnail to be generated
			saved_drawings[current_drawing.timestamp] = current_drawing;
			//drawing is identified by timestamp and can be loaded by dbl clicka and deleted with submit
			$('.archive').prepend('<form class="archive-image"><img src="' + current_drawing.thumbnail + '" alt="Saved Image" width="168"><input type="submit" value="Delete"></form>');
			$('.archive-image').first().show('slow', 'linear').data('timestamp', current_drawing.timestamp).dblclick(load_drawing).submit(delete_drawing);
		}
	});
	
	// Triggers
	$('canvas.board').on('mousedown', enable_draw);
	$(window).resize();
});