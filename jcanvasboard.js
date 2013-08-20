  // Load the SDK Asynchronously
(function(d){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));

var user_data;

$(document).ready(function() {
	var canvas_border = parseInt($('canvas.board').css('border-left-width'), 10);
	var socket = io.connect(document.location.href);
	var draw_data = {'color': 'black', 'size': 7, 'scale': 1};
	var write_data = {'color': 'black', 'font_style': '', 'font_weight': '', 'font_size': '20', 'font_family': 'Arial', 'scale': 1};
	var image_data = {};
	var data_points = [];
	var last_point = {};
	var canvas_offset;
	var leftgap = 0;
	var topgap = 0;
	var rightgap = 0;
	var bottomgap = 0;
	var saved_drawings = {};

		// Additional JS functions here
	window.fbAsyncInit = function() {
		FB.init({
			appId      : '468916983177004', // App ID
			channelUrl : '//www.rhetorical-paper-58.a.pogoapp.com/channel.html', // Channel File
			status     : true, // check login status
			cookie     : true, // enable cookies to allow the server to access the session
			xfbml      : true  // parse XFBML
		});

		// Additional init code here

		FB.Event.subscribe('auth.authResponseChange', function(response){
			if (response.status === 'connected') {
				// connected
				$('.logout').show();
				$('.fb-login-button').hide();
				access_token = response.authResponse.accessToken;
				console.log('fb login');
			} else if (response.status === 'not_authorized') {
				// not_authorized
				$('.logout').hide();
				$('.mini-login').show();
				$('.fb-login-button').show();
				access_token = null;
				console.log('fb not authorized');
			} else {
			// not_logged_in
				$('.logout').hide();
				$('.mini-login').show();
				$('.fb-login-button').show();
				access_token = null;
				console.log('fb logout');
			}
		});
	};

	//Initializers

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

	//Event Handlers

		//Draw Handlers

		//Button Handlers

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

	$('.logout').click( function(e){
		logout();
	});

	function logout(){
		user_data = undefined;
		saved_drawings = undefined;
		$('.logout').hide();
		$('.mini-login').show();
		$('.archive').html('');
		FB.getLoginStatus(function(response) {
			if (response.status === 'connected') {
				// connected
				FB.logout(function(response){
				});
			}else {
				// not_logged_in
				console.log('logged out of scridoodle server');
			}
		});
	}

	$('.color').click( function(e) {
		e.preventDefault();
		$('.color').removeClass('selected');
		draw_data.color = $(this).addClass('selected').css('background-color');
		write_data.color = draw_data.color;
		$('.brushes .size').css({'background-color': draw_data.color});
		$('.font-sizes').css({'color': draw_data.color});
		$('.text-box textarea').css({'color': draw_data.color});
		if(draw_data.color == 'rgb(255, 255, 255)'){
			$('.font-sizes .size').css({'background-color': 'black'});
		}
		else
		{
			$('.font-sizes .size').css({'background-color': 'white'});
		}
	});

	$('.brushes .size').click( function(e) {
		e.preventDefault();
		$('.brushes .size').removeClass('selected');
		draw_data.size = $(this).addClass('selected').attr("data-size");
	});

	$('.font-sizes .size').click( function(e) {
		e.preventDefault();
		$('.font-sizes .size').removeClass('selected');
		write_data.font_size = $(this).addClass('selected').attr("data-size");
		$('.text-box textarea').css({'font-size': write_data.font_size + "px"});
	});

	$('.font').click( function(e) {
		e.preventDefault();
		$('.font').removeClass('selected');
		write_data.font_family = $(this).addClass('selected').html();
		$('.font-sizes').css({'font-family': write_data.font_family});
		$('.text-box textarea').css({'font-family': write_data.font_family});
	});

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

	$('.underline').click( function(e) {
		e.preventDefault();
		$(this).toggleClass('selected');
		if($(this).hasClass('selected')){
			$('.font-sizes').css({'text-decoration': 'underline'});
			$('.text-box textarea').css({'text-decoration': 'underline'});
		}
		else{
			$('.font-sizes').css({'text-decoration': 'none'});
			$('.text-box textarea').css({'text-decoration': 'none'});
		}
	});

	$('.save').click( function(e){
		e.preventDefault();
		var thumbnail = $('canvas.board').getCanvasImage('jpeg', 0.1);
		console.log({'timestamp': e.timeStamp, 'user': user_data.username, 'data': data_points, 'thumbnail': thumbnail});
		socket.emit('save', {'timestamp': e.timeStamp, 'user': user_data.username, 'data': data_points, 'thumbnail': thumbnail});
	});

	$('.upload').click(function(e){
		e.preventDefault();
		$('.background-upload>input').trigger('click');
	});

	$('.background-upload').change(function(e){
		$(this).submit();
	});

	$('.background-upload').submit(function(e){
		e.preventDefault();
		var file = $('.background-upload input:file').get(0).files[0];
		var src;
		var reader = new FileReader();
		reader.onload = function(e) {
			src = e.target.result;
			$('.uploaded-images').prepend('<form><img src="' + src + '" alt="Uploaded Image"><input type="submit" value="Delete"></form>');
			$('.uploaded-images form').first().show('slow', 'linear').submit( function(e){
				e.preventDefault();
				$(this).hide('slow', 'linear', function(){
					$(this).remove();
				});
			}).children('img').mousedown( function(e){
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

	/*$('.fb-upload').click(function(e){
		e.preventDefault();
		if(user_album_data === undefined){
			FB.login(function(response) {
				// handle the response
				FB.api('/me/albums?fields=id,name,cover_photo', generate_photo_browser(response));
			}, {scope: 'user_photo,friends_photo'});
		}
		else{
			generate_photo_browser(user_album_data);
		}
		
				'<figure class="photo-preview" data-id=""><img src="" alt="Facebook Photo"><figcaption></figcaption></figure>'
			});
	
	function generate_photo_browser(response){
		FB.api('/','POST', {
			'access_token': access_token,
			'batch': [
				{
					'method': 'GET',
					'relative_url':
				}]
		}, function(response){
			$.each(response.data, function(index, image_data){
			
			});
			$('.photo-browser').show();
		});
	}*/
	
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
		draw_image(image_data);
		$(this).hide();
	});

	$('.clear').click( function(e) {
		e.preventDefault();
		data_points = [];
		refresh();
		socket.emit('clear');
	});

	$('.undo').click( function(e) {
		e.preventDefault();
		undo(socket.socket.sessionid);
		socket.emit('undo');
	});

	$('.tooltab').click( function(e){
		e.preventDefault();
		$('canvas.board').off().on('mousedown', enable_draw);
		if($(this).parent().css('z-index') == 1 && $('.optional-toolbar').hasClass('open') || !$('.optional-toolbar').hasClass('open')){
			$('.optional-toolbar').toggleClass('open');
		}
		$(this).parent().siblings().css('z-index', 0);
		$(this).parent().css('z-index', 1);
	});

	function text_tools_on(e){
		$('canvas.board').off('mousedown', enable_draw).on('click', text_entry);
		$('.font-sizes').show();
		$('.brushes').hide();
		$('.text-box textarea').val('');
		$('.text-box').css({'width': '200px', 'height': '100px'});

		$('.tooltab').on('click', text_tools_off);
		$('.text-tools .tooltab').off('click', text_tools_on);
	}

	function text_tools_off(e){
		$('canvas.board').off('click', text_entry);
		$('.text-box').hide();
		$('.font-sizes').hide();
		$('.brushes').show();
		$('.text-tools .tooltab').on('click', text_tools_on);
		$('.tooltab').off('click', text_tools_off);
	}

	function zoom_tools_on(e){
		$('.tooltab').on('click', zoom_tools_off);
		$('.zoom_tools .tooltab').off('click', zoom_tools_on);
	}

	function zoom_tools_off(e){
		$(this).siblings().removeClass('selected');
		$('canvas.board').off('mousedown', enable_drag).off('click', zoomIn).off('click', zoomOut);
		$(document).off('mouseup', disable_drag);
		$('.zoom_tools .tooltab').on('click', zoom_tools_on);
		$('.tooltab').off('click', zoom_tools_off);
	}

	$('.zoom-tools .tooltab').on('click', zoom_tools_on);
	$('.text-tools .tooltab').on('click', text_tools_on);
		//Text Handlers

	$('.text-box').resizable({
		handles: 'se'
	});

	$('.image-box').draggable();
	$('.image-box').resizable({
		handles: 'se'
	});

	$('.text-box textarea').keyup( function(e){
		if($(this)[0].scrollWidth > parseInt($(this).css('width'), 10) + 4){
			$('.text-box').css({'width': $(this)[0].scrollWidth + 'px', 'height': $(this).css('height')});
		}
		if($(this)[0].scrollHeight > parseInt($(this).css('height'), 10) + 4){
			$('.text-box').css({'width': $(this).css('width'), 'height': $(this)[0].scrollHeight + 'px'});
		}
	});
	
	$('.text-box').hover( function(e){
		$('.text-box input').show(50);
	}, function(e){
		$('.text-box input').hide(100);
	});
	
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
		$('.text-box').css({'width': '200px', 'height': '100px'});	});
	
		//Zoom Handlers
		
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
	
	$(window).resize( function(e) {
		canvas_offset = $('canvas.board').offset();
		canvas_offset.left = canvas_offset.left + canvas_border;
		canvas_offset.top = canvas_offset.top + canvas_border;
	});
	
	//Functions
	
		//Drawing
		
	var draw_to_point = function(e){
		var prevx = draw_data.x;
		var prevy = draw_data.y;
		draw_data.x = (e.pageX - canvas_offset.left) / draw_data.scale + leftgap;
		draw_data.y = (e.pageY - canvas_offset.top) / draw_data.scale + topgap;
		draw_data.id = socket.socket.sessionid;
		socket.emit('draw', draw_data);
		draw_line(draw_data, prevx, prevy);
	};
	
	var enable_draw = function(e) {
		$('canvas.board').on('mousemove', draw_to_point);
		$(document).on('mouseup', disable_draw);
		draw_data.x = (e.pageX - canvas_offset.left) / draw_data.scale + leftgap;
		draw_data.y = (e.pageY - canvas_offset.top) / draw_data.scale + topgap;
		draw_data.id = socket.socket.sessionid;
		socket.emit('draw', draw_data);
		draw_circle(draw_data);
	};
	
	var disable_draw = function(e) {
		$('canvas.board').off('mousemove', draw_to_point);
		socket.emit('draw',{'id': socket.socket.sessionid});
		$(document).off('mouseup', disable_draw);
	};
	
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
	
	var draw_circle = function(point){
		$('canvas.board').drawArc({
			fillStyle: point.color,
			radius: point.size / 2 / point.scale,
			x: point.x, y: point.y
		});
	};
	
	var draw_line = function(point, prevx, prevy){
		$('canvas.board').drawLine({
			strokeStyle: point.color,
			strokeWidth: point.size / point.scale,
			rounded: true,
			x1: prevx, y1: prevy,
			x2: point.x, y2: point.y
		});
	};
	
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
	
		//Text
		
	var text_entry = function(e){
		write_data.x = e.pageX - canvas_offset.left;
		write_data.y = e.pageY - canvas_offset.top;
		var text_box_padding_border_sum = parseInt($('.text-box').css('padding-left'), 10) * 2 + parseInt($('.text-box').css('border-left-width'), 10) * 2;
		var area_max_width = $('canvas.board').width() - write_data.x - text_box_padding_border_sum;
		var area_max_height = $('canvas.board').height() - write_data.y - text_box_padding_border_sum;
		$('.text-box').resizable('option', 'maxWidth', area_max_width);
		$('.text-box').resizable('option', 'maxHeight', area_max_height);
		$('.text-box').css({'maxWidth': area_max_width, 'maxHeight': area_max_height, 'top': write_data.y + canvas_border, 'left': write_data.x + canvas_border});
		write_data.x = (write_data.x + 3) / write_data.scale + leftgap;
		write_data.y = (write_data.y  + 3) / write_data.scale + topgap;
		$('.text-box').show();
		$('.text-box textarea').focus();
	};
	
	var draw_text = function(paragraph){
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
	};
	
		//Deletion
	
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
	
	var refresh = function(data){
		var i;
		data = typeof data !== 'undefined' ? data : data_points;
		$('canvas.board').clearCanvas();
		$('canvas.board').drawRect({
			fillStyle: "#ffffff",
			x: 400, y: 200,
			width: 800, height: 400
		});
		for(i = 0; i < data.length; i++){
			draw(data[i]);
		}
	};
	
		//Zoom
	
	var zoomIn = function(e){
		var x = (e.pageX - canvas_offset.left) / draw_data.scale;
		var y = (e.pageY - canvas_offset.top) / draw_data.scale;
		$('canvas.board').scaleCanvas({
			x: x + leftgap, y: y + topgap,
			scale: 1.25,
			autosave: false
		});
		refresh();
		leftgap += x * 0.2;
		topgap += y * 0.2;
		rightgap += ($('canvas.board').width() / draw_data.scale - x) * 0.2;
		bottomgap += ($('canvas.board').height() / draw_data.scale - y) * 0.2;
		write_data.scale = draw_data.scale = draw_data.scale * 1.25;
	};
	
	var zoomOut = function(e){
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
			leftgap -= x * 0.25;
			topgap -= y * 0.25;
			rightgap -= ($('canvas.board').width() / draw_data.scale - x) * 0.25;
			bottomgap -= ($('canvas.board').height() / draw_data.scale - y) * 0.25;
			write_data.scale = draw_data.scale = draw_data.scale * 0.8;
		}
	};
	
	var enable_drag = function(e){
		var x = (e.pageX - canvas_offset.left) / draw_data.scale + leftgap;
		var y = (e.pageY - canvas_offset.top) / draw_data.scale + topgap;
		$('canvas.board').on('mousemove', {x: x, y: y}, drag);
	};
	
	var drag = function(e){
		var x = (e.pageX - canvas_offset.left) / draw_data.scale + leftgap;
		var y = (e.pageY - canvas_offset.top) / draw_data.scale + topgap;
		var deltax =  x - e.data.x;
		var deltay =  y - e.data.y;
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
		//e.data.x = x;
		//e.data.y = y;
		refresh();
	};
	
	var disable_drag = function(e){
		$('canvas.board').off('mousemove', drag);
	};
	// Socket IO
	
	socket.on('draw', function(point){
		if(point.id != socket.socket.sessionid){
			draw(point);
		}
		data_points.push(point);
	});
	
	socket.on('refresh', function(data){
		data_points = data;
		refresh();
	});

	socket.on('undo', function(userid){
		undo(userid);
	});
	
	socket.on('clear', function(){
		data_points = [];
		refresh();
	});
	
	socket.on('login', function(data){
		user_data = data;
		list_friends();
		console.log(user_data);
		$('.mini-login').hide();
		$('.logout').show();
		$('.login-dialog').hide();
	});
	
	socket.on('store drawings', function(drawings_to_add){
		var i;
		for(i=0;i<drawings_to_add.length;i++){
			var current_drawing = drawings_to_add[i]; //change thumbnail to be generated
			saved_drawings[current_drawing.timestamp] = current_drawing;
			$('.archive').prepend('<form class="archive-image"><img src="' + current_drawing.thumbnail + '" alt="Saved Image" width="168"><input type="submit" value="Delete"></form>');
			$('.archive-image').first().show('slow', 'linear').data('timestamp', current_drawing.timestamp).dblclick(load_drawing).submit(delete_drawing);
		}
	});
	
	socket.on('update friends', function(friends){
		user_data.friends = friends;
		list_friends();
	});
	
   function load_drawing(e){
   	e.preventDefault();
		data_points = saved_drawings[$(this).data('timestamp')].data;
		refresh();
   }
   
   function delete_drawing(e){
   	e.preventDefault();
		$(this).hide('slow', 'linear', function(){
			$(this).remove();
		});
		saved_drawings[$(this).data('timestamp')] = undefined;
		socket.emit('delete', user_data.username + ':' + $(this).data('timestamp'));
   }
	$('canvas.board').on('mousedown', enable_draw);
	$('.login-dialog>a:last').on('click', function(e){
		$(this).parent().hide();
	});
	
	$('.login').on('submit', function(e){
		e.preventDefault();
		socket.emit('login', {username: $('.login>input[type="email"]').val(), password: $('.login>input[type="password"]').val()});
	});
	
	$('.login-dialog>a:first').first().on('click', function(e){
		console.log('signup');
		socket.emit('sign up', {username: $('.login>input[type="email"]').val(), password: $('.login>input[type="password"]').val()});
	});
	
	$('.mini-login').on('click', function(e){
		$('.login-dialog').show();
	});
	
	$('.add-friend').on('submit', function(e){
		e.preventDefault();
		socket.emit('request friend', $('.add-friend>input').val());
	});
	
	function list_friends(){
		var i;
		for(i=0;i<user_data.friends.length;i++){
			if(user_data.friends[i].status == 'pending'){
				$('.friend-list').append('<div>Friendship with ' + user_data.friends[i].user + ' is pending</div>');
			}
			else if(user_data.friends[i].status == 'request'){
				$('.friend-list').append('<div>' + user_data.friends[i].user + ' would like to be your friend<br><a>yes</a> or <a>no</a>?</div>');
				$('.friend-list>div').last().data('user', user_data.friends[i].user).children().first().on('click', accept_friend);
				$('.friend-list>div').last().children().last().on('click', deny_friend);
			}
			else{
				$('.friend-list').append('<div>' + user_data.friends[i].user + ': ' + user_data.friends[i].status + '</div>');
			}
		}
	};
	
	function accept_friend(e){
		
	}
	
	function deny_friend(e){
		
	}
	// Triggers
	
	$(window).resize();
	$('canvas.board').saveCanvas();
});