define(['../../app'],function(app){

	return app.factory('responseErr', ['$q','$injector','$window', function($q,$injector,$window){
		var responseErr = {
			response: function(response) {
				if(response.status !== 200){
					if(response.status === 1){
						return $q.reject('验证码错误');
					}
					else if(response.status === 210){

						return $q.reject('密码错误');
					}
					else if(response.status === 211){

						return $q.reject('账号不存在');
					}

					else if(response.status === 214){
						return $q.reject('该手机号已经注册');
					}
					else{
						return $q.reject('未知错误');
					}
				}else{
					return response;
				}

			},
			responseError:function(response){
				if(response.status === 501){

					var sessionExpiresTime = new Date(),loginStatus = {};
					sessionExpiresTime.setDate(sessionExpiresTime.getDate() - 1);
					loginStatus.sessionExpires = sessionExpiresTime;
					loginStatus.logined = false;
					$window.localStorage['loginStatus'] = JSON.stringify(loginStatus);

					// window.location = "/login";
					return response;
				}else if(response.status === 404){
					// alert("地址未找到");
					// return response;
					return $q.reject("未找到资源");
				}
				else{
					return $q.reject("未知错误");
				}
			}
		}
		return responseErr;
	}])

});
