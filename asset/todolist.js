//jquery 공부해야할 부분
//bind, map, classList, class remove add,
var TODOSync = {
	url : "http://ui.nhnnext.org:3333/",
	id : "astomusic",
	
	init : function() {
		$(window).on("online", this.onoffLineListener);
		$(window).on("offline", this.onoffLineListener);
	},

	onoffLineListener : function() {
		document.getElementById("header").classList[navigator.onLine?"remove":"add"]("offline");

		if(navigator.onLine) {
			//서버와 sync
		}
	},

	get : function(callback) {
		$.ajax({
			type: "GET",
			url: this.url + this.id,
		}).done(function( msg ) {
			callback(msg);
		});
	},

	add : function(todo, callback) {
		if(navigator.onLine) {
			$.ajax({
				type: "PUT",
				url: this.url + this.id,
				data: { todo: todo }
			}).done(function( msg ) {
				callback(msg);
			});
		} else {
			//data client 에 저장
			//localStorage, idexed DB, wegsql
		}
	},

	completed : function(param, callback) {
		$.ajax({
			type: "POST",
			url: this.url + this.id + "/" + param.key,
			data: { completed: param.completed }
		}).done(function( msg ) {
			callback(msg);
		});
	},

	updated : function(param, callback) {
		$.ajax({
			type: "POST",
			url: this.url + this.id + "/" + param.key,
			data: { todo: param.todo, date : param.date }
		}).done(function( msg ) {
			callback();
		});
	},

	remove : function(key, callback) {
		$.ajax({
			type: "DELETE",
			url: this.url + this.id + "/" + key,
		}).done(function( msg ) {
			callback();
		});
	}
}

var TODO =  {
	ENTER_KEYCODE : 13,
	SelectedIndex : 0,

	init :  function() {
		TODOSync.init();
		this.initEventBind();
		this.getTodoList();
		utility.featureDetector();
	},

	initEventBind : function() {
		$("#new-todo").on("keydown", this.add.bind(this));
		$("#todo-list").on("click", ".toggle", this.completed.bind(this));
		$("#todo-list").on("click", ".destroy", this.remove.bind(this));
		$("#clear-completed").on("click", this.clearCompleted.bind(this));
		//double click event 추가
		$("#todo-list").dblclick(function(e) {
			if(e.target.tagName === "LABEL") this.edit(e);
			if(e.target.className.trim() === "date") this.editDate(e);
		}.bind(this));

		//드레그 이벤트 확인을 위한 마우스 다운 이벤트 등록
		$("#todo-list").on("mousedown", "label", this.drag.bind(this));

		$("#filters").on("click", "a", this.changeStateFilter.bind(this));

		$(window).on("popstate", this.chageURLFilter.bind(this));
	},

	drag : function(e) {
		//드레그 이벤트 발생시 
		this.pauseEvent(e);
		var startY = e.clientY;
		var ilTarget = e.target.parentNode.parentNode;

		$(document).on("mousemove", function(eMove){
			var diff = eMove.clientY - startY;
			$(ilTarget).css({
				top: diff,
				backgroundColor: 'rgba(255, 255, 255, 0.8)',
				border: '1px solid #ccc',
				zIndex: 100
			});
			this.swap(eMove);
		}.bind(this));

		$(document).on("mouseup", function(){
			$(document).off("mousemove");
			$(ilTarget).css({
				top: 0,
				backgroundColor: 'rgba(0, 0, 0, 0)',
				border: 'none',
				borderBottom: '1px dotted #ccc',
				zIndex: 1
			});
		});
	},

	swap : function(e) {
		var $li = $(e.target).closest('li');
		if (jQuery(e.target).is('.move-down')) {
			$li.next('li').after($li); 
			console.log($li.next('li'));
		} else {
	       	$li.prev('li').before($li);
	       	console.log($li.prev('li'));
	    }
	},

	todoCount : function() {
		//남은 todo의 숫자를 count 해준다
		//todo-list에서 completed 되지 않은 li의 수를 세어서 todo-count에 넣어준다.
		var completed = $("li .completed", $("#todo-list"));
		var uncompleted = $("li", $("#todo-list"));
		var todoCount = $("#todo-count");
		var completedCount = $('button', $("#footer"));

		var countCompeleted = completed.length;
		var countUncompleted = uncompleted.length - countCompeleted;

		completedCount.html("Clear completed(<strong>" + countCompeleted + "</strong>)");
		todoCount.html("<strong>" + countUncompleted  + "</strong> items left");
	},

	clearCompleted : function(e) {
		//completed 된 todos 확인
		//해당 노드에 remove메소드 호출
		$("button", $("#todo-list .completed")).click();
	},

	pauseEvent : function(e){
		//마우스 드래그시 마우스에 의한 text select을 방지해준다.
		e.stopPropagation();
		e.preventDefault();
	},

	edit : function(e) {
		//더블클릭한 라벨의 정보를 추출하고 input가능 상태로 변경한다.
		//엔터키와 클릭으로 수정 이벤트를 종료한다.(화면에 업데이트 전에 서버로 업데이트)
		//서버단에 업데이트가 구현이 되어있지 않은 문제?
		e.stopPropagation(); 
		var currentEle = e.target;
		var value = currentEle.innerText;
		var li = $(currentEle).closest('li');
		var key = li[0].dataset.key;

		$(currentEle).html('<input type="text" class="thVal" value="' + value + '" />');
		$(".thVal").select();
		//엔터키 처리
		$(".thVal").keyup(function (event) {
			if (event.keyCode == this.ENTER_KEYCODE) {
				value = $(".thVal").val();
				TODOSync.updated({key: key, todo: value}, function(){
					$(currentEle).html(value);
				});
			}
		}.bind(this));
		//클릭처리
		$(document).click(function () {
			console.log(e.target);
			//LABEL이 잡히는 문제
			if(e.target.tagName !== "INPUT") {
				value = $(".thVal").val();
				TODOSync.updated({key: key, todo: value}, function(){
				$(currentEle).html(value);
				});
				$(document).off('click');
			}
		}.bind(this));
	},

	editDate : function(e) {
		e.stopPropagation(); 
		var currentEle = e.target;
		var value = currentEle.innerText;
		var li = $(currentEle).closest('li');
		var key = li[0].dataset.key;

		$(currentEle).html('<input type="text" class="thVal" value="' + value + '" />');
		$(".thVal").focus();
		$(".thVal").datepicker({ dateFormat: "yy/mm/dd" });
		//엔터키 처리
		$(".thVal").keyup(function (event) {
			if (event.keyCode == this.ENTER_KEYCODE) {
				value = $(".thVal").val();
				TODOSync.updated({key: key, date: value}, function(){
					$(currentEle).html(value);
				});
			}
		}.bind(this));
		//클릭처리
		$(document).click(function (e) {
			if(e.target.tagName !== "INPUT") {
				value = $(".thVal").val();
				TODOSync.updated({key: key, date: value}, function(){
				$(currentEle).html(value);
				});
				$(document).off('click');
			}
		}.bind(this));
	},

	chageURLFilter : function(e) {
		if(e.state) {
			var method = e.state.method;
			this[method+"View"]();
		} else {
			this.allView();
		}
	},

	changeStateFilter : function(e) {
		var target =  e.target
		var href = target.getAttribute("href");
		if(href === "index.html") {
			this.allView();
			history.pushState({"method":"all"},null,"index.html");
		} else if(href === "active") {
			this.activeView();
			history.pushState({"method":"active"},null,"active");
		} else if(href === "completed") {
			this.completedView();
			history.pushState({"method":"completed"},null,"completed");
		}
		e.preventDefault();
	},

	allView : function() {
		$("#todo-list")[0].className = "";
		this.selectNavigtor(0);
	},

	activeView : function() {
		$("#todo-list")[0].className = "all-active";
		this.selectNavigtor(1);
	},

	completedView : function() {
		$("#todo-list")[0].className = "all-completed";
		this.selectNavigtor(2);
	},

	selectNavigtor : function(index) {
		var navigatorList = $("#filters a");
		navigatorList[this.SelectedIndex].classList.remove("selected");
		navigatorList[index].classList.add("selected");
		this.SelectedIndex = index;
	}, 

	getTodoList : function() {
		TODOSync.get(function(response){
			var initLiArr = response.map(function(res){
				var completed = res.completed?"completed":"";
				var checked = res.completed?"checked":"";
				var date = utility.dataToDate(res.date);
				console.log(res.date);
				return this.build(res.todo, date, res.id, completed, checked);
			}.bind(this));
			var appendedTodo = $('#todo-list').append(initLiArr.join(""));
			this.todoCount();
		}.bind(this));
	},

	build : function(todo, date, key, completed, checked) {
		var template_vars = {
			text: todo,
			date: date,
			key: key,
			completed: completed,
			checked: checked
		}
		var template = utility.todoTemplate();
		var html = Mustache.to_html(template, template_vars);

		return html;
	},

	completed : function(e) {
		var li = $(e.target).closest('li');
		var checked = $(e.target).prop("checked")?"1":"0";
		var date = $(e.target).next('.date');
		var dateBackUp = date[0].innerText;

		TODOSync.completed({
			key: li[0].dataset.key,
			completed: checked
		},function(res){
			if(checked == "1") {
				li.addClass("completed");
				date.addClass("completed");
			} else {
				li.removeClass("completed");
				date.removeClass("completed");
			}
			this.todoCount();
		}.bind(this));
	},

	remove : function(e) {
		var li = $(e.target).closest('li');
		var ul = li.parent();

		var key = li[0].dataset.key;

		TODOSync.remove(key, function() {
			li.css("opacity", 0);
			li.on(utility.transitionEnd, function() {
				li.remove();
				this.todoCount();
			}.bind(this));
		}.bind(this));
	},

	add : function(e){
		if(e.keyCode === this.ENTER_KEYCODE) {
			var todo = $("#new-todo")[0].value;
			
			TODOSync.add(todo, function(json){
				var todoLi = this.build(todo, utility.now, json.insertId, "", "");
				var appendedTodo = $('#todo-list').prepend(todoLi);
				$("#new-todo")[0].value = "";
				$("#todo-list li:last-child").offsetHeight;
				this.todoCount();
			}.bind(this));	
		}
	}
}

var utility = {
	transitionEnd : "",

	now : function() {
		var currentdate = new Date();
		var twoDigitMonth = ((currentdate.getMonth().length+1) === 1)? (currentdate.getMonth()+1) : '0' + (currentdate.getMonth()+1);
		var twoDigitDate= ((currentdate.getDate().length+1) === 1)? (currentdate.getDate()+1) : '0' + (currentdate.getDate());
		var datetime = currentdate.getFullYear() + "-"
		var datetime = currentdate.getFullYear() + "/"
		+ twoDigitMonth + "/" + twoDigitDate
		return datetime;
	},

	dateToData : function(date) {
		date = date.split("/").join("-");
		date =  date + "T00:00:00.000Z";
		return date;
	},

	dataToDate : function(date) {
		date = date.split("-").join("/");
		date = date.substring(0,date.length-14);
		return date;
	},

	featureDetector : function() {
		// 해당브라우져에서 동작가능한 transitionEnd 타입을 찾아서 해당 타입을 result로 반환 해준다.
		var result;
		var elForCheck = document.querySelector("body");

		var status = {
			"transitionEnd" : typeof elForCheck.style.transform,
			"webkitTransitionEnd" : typeof elForCheck.style.webkitTransform,
			"mozTransitionEnd" : typeof elForCheck.style.MozTransform,
			"OTransitionEnd" : typeof elForCheck.style.OTransform,
			"msTransitionEnd" : typeof elForCheck.style.msTransform
		}

		for ( var key in status) {
			if (status[key] !== "undefined") {
				result = key;
			}
		}

		this.transitionEnd = result;
	},

	todoTemplate : function() {
		var temp = "";
		temp += "<li data-key={{key}} class={{completed}}>";
		temp += "<div class=\"view\">";
		temp += "<input class=\"toggle\" type=\"checkbox\" {{checked}}>"
		temp += "<div class=\"date {{completed}}\">{{date}}</div>";
		temp += "<label>{{text}} </label>";
		temp += "<button class=\"destroy\"></button>";
		temp += "</div>";
		temp += "</li>";

		return temp;
	}
}

document.addEventListener("DOMContentLoaded",TODO.init.bind(TODO));