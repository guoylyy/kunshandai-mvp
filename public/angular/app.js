/**
 * @author: Ethansure
 */
'use strict';

define(['angular','uiRouter','uiBootstrap','angularLoadingBar','uiUtils','angularFileUpload','angularSweetAlert', 'highcharts-ng','angularBusy','uiSelect','angualrSanitize','duScroll'],function(angular){
	var changeUrl = function(evt){
		if(window.location.pathname == '/login'
			|| window.location.pathname == '/signup'
			|| window.location.pathname == '/help'
			|| window.location.pathname == '/retrieve_password'){
			return;
		}else{
			evt.preventDefault();
			window.location = '/login';
			return;
		}
	}
	return angular.module('app',['ui.router','ui.bootstrap','angular-loading-bar','ui.utils','angularFileUpload','oitozero.ngSweetAlert','highcharts-ng','cgBusy','ui.select','ngSanitize','duScroll'])
	.config(['$httpProvider',function($httpProvider) {
		$httpProvider.interceptors.push('sessionAuth');
		$httpProvider.interceptors.push('responseErr');
	}])
	.value('cgBusyDefaults',{
	  message:'请求数据中...',
	  backdrop: true,
	  // templateUrl: 'my_custom_template.html',
	  delay: 0,
	  minDuration: 0
	})
	.run(function($rootScope,$state, $urlRouter,$window,$location,AccountService) {
    	$rootScope.$on('$locationChangeStart', function(evt) {
      	// Halt state change from even starting
      	// Perform custom logic
      	
		var userInfo 	= $window.localStorage['userInfo'];
		var loginStatus = $window.localStorage['loginStatus'];
		if(userInfo){
			userInfo = JSON.parse(userInfo);
			userInfo.expires  = new Date(userInfo.expires);
		}
		if(loginStatus){
			loginStatus = JSON.parse(loginStatus);
			loginStatus.sessionExpires = new Date(loginStatus.sessionExpires);
		}else{
			loginStatus = {logined:false};
			$window.localStorage['loginStatus'] = JSON.stringify(loginStatus);
		}

		var now 		= new Date();


		//自动登录情况
		if(userInfo){
			//session过期
			if(now > loginStatus.sessionExpires){
				loginStatus.logined = false;
				$window.localStorage['loginStatus'] = JSON.stringify(loginStatus);

				//记住状态期限内则重新登录，否则跳到登录页面
				if(now < userInfo.expires){
					var b = new Base64();  
        			userInfo.password = b.decode(userInfo.password);
					AccountService.login(userInfo).then(function(){
						document.location.reload(true);
					},function(){
						console.log("自动登录失败");
					});

				}else{

					changeUrl(evt);
				}

			}else{
				return;
			}
		}else{
			//session过期
			if(now > loginStatus.sessionExpires){
				loginStatus.logined = false;
				$window.localStorage['loginStatus'] = JSON.stringify(loginStatus);
				changeUrl(evt);
				return;
			}else{
				return;
			}
		}

    	})
    })
	.constant('datepickerPopupConfig', {
	  datepickerPopup: 'yyyy-MM-dd',
	   currentText: "今天",
	  clearText: "清除",
	  closeText: "关闭",
	  closeOnDateSelection: true,
	  appendToBody: false,
	  showButtonBar: true
	})
	.value('duScrollOffset', 190)
	.constant("ApiURL","/v1");

});
