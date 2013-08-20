$(document).ready( function() {
	var canvas_border = parseInt($('canvas.board').css('border-left-width'), 10);
	var socket = io.connect(document.location.href);
	var last_point = {};
	var draw_data = {'color': 'black', 'size': 7};
	var write_data = {'color': 'black', 'font_style': '', 'font_weight': '', 'font_size': '20', 'font_family': 'Arial'};
	var offset, prevx, prevy;
	var data_points = [];
	
	$.jCanvas.extend({
		name: "textUnderline",
		fn: function(context, p) {

			var textWidth = context.measureText(p.text).width;
			var startX = 0;
			var startY = p.y + 85 * parseInt(p.textSize, 10) / 100;
			var endX = 0;
			var endY = startY;
			var underlineHeight = 1;

			context.beginPath();
			startX = p.x;
			endX = p.x + textWidth;

			context.strokeStyle = p.color;
			context.lineWidth = underlineHeight;
			context.moveTo(startX, startY);
			context.lineTo(endX, endY);
			context.stroke();
		}
	});

	$('.brushes .size').each( function(index){//initialize brush size buttons
		var width = $(this).attr('data-size');
		$(this).css({'width': width + 'px', 'height': width + 'px', 'background': draw_data.color});
	});
	
	$('.font-sizes .size').each( function(index){
		var pixels = $(this).attr('data-size');
		$(this).css({'font-size': pixels + 'px'});
		$(this).css({'width': pixels + 'px', 'height': pixels + 'px'});
	});
	
	$('.font').each( function(index){//initialize font buttons
		var font_family = $(this).html();
		$(this).css({'font-family': font_family});
	});
	
	var draw_to_point = function(e){
		prevx = draw_data.x;
		prevy = draw_data.y;
		draw_data.x = e.pageX - offset.left;
		draw_data.y = y = e.pageY - offset.top;
		socket.emit('draw', draw_data);
		draw_line(draw_data, prevx, prevy);
	};
	
	var enable_draw = function(e) {
		$(this).on('mousemove', draw_to_point);
		draw_data.x = e.pageX - offset.left;
		draw_data.y = y = e.pageY - offset.top;
		socket.emit('draw', draw_data);
		draw_circle(draw_data);
	};
	
	var disable_draw = function(e) {
		$(this).off('mousemove', draw_to_point);
		socket.emit('draw',{});
	};
	
	$('canvas.board').on('mousedown', enable_draw);

	$('canvas.board').on('mouseup', disable_draw);

	$(window).resize( function(e) {
		offset = $('canvas.board').offset();
		offset.left = offset.left + canvas_border;
		offset.top = offset.top + canvas_border;
	});

	$(window).resize();
	
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
	
	$('.clear').click( function(e) {
		e.preventDefault();
		$('canvas.board').clearCanvas();
		socket.emit('clear');
	});

	$('.undo').click( function(e) {
		e.preventDefault();
		socket.emit('undo');
	});
	
	$('.tooltab').click( function(e){
		e.preventDefault();
		if($(this).parent().css('z-index') == 1 && $(this).parent().hasClass('open') || !$(this).parent().hasClass('open')){
			$(this).parent().siblings().toggleClass('open');
			$(this).parent().toggleClass('open');
		}
		$(this).parent().siblings().css('z-index', 0);
		$(this).parent().css('z-index', 1);
		if($('.text-tools').hasClass('open') && $(this).parent().hasClass('text-tools')){
			$('canvas.board').on('click', text_entry).off('mousedown', enable_draw).off('mouseup', disable_draw);
			$('.font-sizes').show();
			$('.brushes').hide();
		}
		else{
			$('canvas.board').off('click', text_entry).on('mousedown', enable_draw).on('mouseup', disable_draw);
			$('.text-box').hide();
			$('.font-sizes').hide();
			$('.brushes').show();
			$('.text-box textarea').val('');
			textareaToSize(200, 100);
		}
	});
	
	$('.text-box textarea').resizable({
		handles: 'se'
	});
	
	$('.text-box textarea').keyup( function(e){
		if($(this)[0].scrollWidth > parseInt($(this).css('width'), 10) + 4){
			textareaToSize($(this)[0].scrollWidth, parseInt($(this).css('height'), 10));
		}
		if($(this)[0].scrollHeight > parseInt($(this).css('height'), 10) + 4){
			textareaToSize($(this).parseInt($(this).css('width'), 10), $(this)[0].scrollHeight);
		}
	});
	
	$('.text-box').submit( function(e){
		e.preventDefault();
		write_data.text = $('.text-box textarea').val();
		write_data.width = $('.text-box textarea').width();
		write(write_data);
		socket.emit('write', write_data);
		socket.emit('write', {'text': "fill"});
		$(this).hide();
		$('.text-box textarea').val('');
		textareaToSize(200, 100);
	});
	
	$('.zoom-in').click( function(e){
		e.preventDefault();
		$(this).toggleClass('selected');
		$(this).siblings().removeClass('selected');
		if($(this).hasClass('selected')){
			$('canvas.board').on('click', zoomIn).off('mousedown', enable_draw).off('mouseup', disable_draw).off('click', zoomOut).off('mousedown', enable_drag);
		}
		else{
			$('canvas.board').off('click', zoomIn).on('mousedown', enable_draw).on('mouseup', disable_draw);
		}
	});
	
	$('.zoom-out').click( function(e){
		e.preventDefault();
		$(this).toggleClass('selected');
		$(this).siblings().removeClass('selected');
		if($(this).hasClass('selected')){
			$('canvas.board').on('click', zoomOut).off('mousedown', enable_draw).off('mouseup', disable_draw).off('click', zoomIn).off('mousedown', enable_drag);
		}
		else{
			$('canvas.board').off('click', zoomOut).on('mousedown', enable_draw).on('mouseup', disable_draw);
		}
	});
	
	$('.drag').click( function(e){
		e.preventDefault();
		$(this).toggleClass('selected');
		$(this).siblings().removeClass('selected');
		if($(this).hasClass('selected')){
			$('canvas.board').on('mousedown', enable_drag).off('mousedown', enable_draw).off('mouseup', disable_draw).off('click', zoomOut).off('click', zoomIn);
		}
		else{
			$('canvas.board').off('mousedown', enable_drag).on('mousedown', enable_draw).on('mouseup', disable_draw);
		}
	});
	
	/*$('.text-box').hover( function(e){
		$('.text-box input').show('fast');
	}, function(e){
		$('.text-box input').hide('fast');
	});*/
	
	var text_entry = function(e){
		write_data.x = e.pageX - offset.left + canvas_border;
		write_data.y = e.pageY - offset.top + canvas_border;
		$('.text-box textarea').resizable('option', 'maxHeight', parseInt($('canvas.board').css('height'), 10) - write_data.y + 20);
		$('.text-box textarea').resizable('option', 'maxWidth', parseInt($('canvas.board').css('width'), 10) - write_data.x + 20);
		$('.text-box textarea').css({
			'max-width': parseInt($('canvas.board').css('width'), 10) - write_data.x + 14,
			'max-height': parseInt($('canvas.board').css('height'), 10) - write_data.y + 14
		});
		$('.text-box').css({
			'max-width': parseInt($('canvas.board').css('width'), 10) - write_data.x + 20,
			'max-height': parseInt($('canvas.board').css('height'), 10) - write_data.y + 20
		});
		$('.ui-wrapper').css({
			'max-width': parseInt($('canvas.board').css('width'), 10) - write_data.x + 20,
			'max-height': parseInt($('canvas.board').css('height'), 10) - write_data.y + 20
		});
		$('.text-box').css({'top': write_data.y, 'left': write_data.x});
		$('.text-box').show();
		$('.text-box textarea').focus();
	};
	
	var textareaToSize = function(x, y){
		$('.text-box textarea').css('width', x + 'px');
		$('.text-box').css('width', x + 6 + 'px');
		$('.ui-wrapper').css('width', x  + 6 + 'px');
		$('.text-box textarea').css('height', y + 'px');
		$('.text-box').css('height', y + 6 + 'px');
		$('.ui-wrapper').css('height', y + 6 + 'px');
	};
	
	var zoomIn = function(e){
		var x = ((e.pageX - offset.left + canvas_border) / scale) + (dim/2)/scale;
		var y = (e.pageY - offset.top + canvas_border) / scale;
		$('canvas.board').scaleCanvas({// dist from center to edge = (dim/2)/scale
			x: x, y: y,
			scaleX: 1.25, scaleY: 1.25
		});
		refresh();
	};
	
	var zoomOut = function(e){
		var x = e.pageX - offset.left + canvas_border;
		var y = e.pageY - offset.top + canvas_border;
		$('canvas.board').scaleCanvas({
			x: x, y: y,
			scaleX: 0.99, scaleY: 0.99
		});
		refresh();
	};
	
	var enable_drag = function(e){

	};
	
	var write = function(paragraph){
		$("canvas.board").drawText({
			fillStyle: paragraph.color,
			strokeWidth: 0,
			x: paragraph.x - 17, y: paragraph.y - 17, // 17=canvasborder-textareaborder-textareapadding
			font: paragraph.font_style + ' ' + paragraph.font_weight + ' ' + paragraph.font_size + 'px ' + paragraph.font_family,
			text: paragraph.text,
			fromCenter: false,
			align: 'left',
			maxWidth: paragraph.width
		});
		data_points.push(paragraph);
		/*$("canvas.board").textUnderline({
			color: paragraph.color,
			x: paragraph.x - 17, y: paragraph.y - 17, // 17=canvasborder-textareaborder-textareapadding
			textSize: paragraph.font_size + 'px',
			text: paragraph.text
		});*/
	};
	
	var draw = function(point){
		if(last_point[point.id] === undefined || last_point[point.id].x === undefined){//if beginning of line
			draw_circle(point);
		}
		else{
			draw_line(point, last_point[point.id].x, last_point[point.id].y);
		}
		last_point[point.id] = point;
	};
	
	var draw_circle = function(point){
		$('canvas.board').drawArc({
			fillStyle: point.color,
			radius: point.size / 2,
			x: point.x, y: point.y
		});
		data_points.push(point);
	};
	
	var draw_line = function(point, prevx, prevy){
		$('canvas.board').drawLine({
			strokeStyle: point.color,
			strokeWidth: point.size,
			rounded: true,
			x1: prevx, y1: prevy,
			x2: point.x, y2: point.y
		});
		data_points.push(point);
	};
	
	socket.on('draw', draw);
	
	socket.on('write', write);
	
	socket.on('refresh', function(data){
		var i;
		$('canvas.board').clearCanvas();
		for(i = 0; i < data_points.length; i++){
			if(data_points[i].text === undefined){
				draw(data_points[i]);
			} else{
				write(data_points[i]);
			}
		}
	});

	socket.on('clear', function(){
		$('canvas.board').clearCanvas();
		data_points = [];
	});
});