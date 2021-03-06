'use strict'

define(['app','underscore'],function(app,_){

	return app.config(['$stateProvider','$urlRouterProvider','$locationProvider',
		function($stateProvider,$urlRouterProvider,$locationProvider){


		$locationProvider.html5Mode({
		  enabled: true,
		  requireBase: false
		});

		var resolveLoans = function(fn,LoanService,BLoanService,DictService,$stateParams){
		    var startDate, endDate, loanType;
				if(!$stateParams.startDate){
					var timeRanges = DictService.get('timeRanges');

					$stateParams.startDate = timeRanges[0].startDate;
					$stateParams.endDate = timeRanges[0].endDate;

				}
				if($stateParams.startDate){
					startDate = new Date(parseInt($stateParams.startDate));
			    endDate = new Date(parseInt($stateParams.endDate));
				}

				loanType = $stateParams.loanType;
		    $stateParams.page = $stateParams.page || 1;
		    return fn.call(this,$stateParams.page,startDate,endDate,loanType).then(function(data){
		    	return data;
		    });

		};
		var resolveObject = function(fn){
			return {
				loans:function(DictService,LoanService,BLoanService,$stateParams){
		    		return resolveLoans(eval(fn),LoanService,BLoanService,DictService,$stateParams);
		    	},
				loanTypes:function(DictService){
					return DictService.get('loanTypes');
				},
				timeRanges:function(DictService){
					return DictService.get("timeRanges");
				}
			}
		},
		resolveLoan = function(){
			return{
				loan:function(LoanService,$stateParams){
					var loanId = $stateParams.ref || $stateParams.id
					if(loanId){
						return LoanService.getLoan(loanId).then(function(data){
		    				return data;
		    			})
					}else{
						return null;
					}

		    	}
			}
		},

		resolveSelectItems = function(){
			return {
	    		loanTypes:function(DictService){
	    			 return DictService.get('loanTypes');
	    		},
	    		repayTypes:function(DictService){
	    			 return DictService.get('payBackWays');
	    		}
		    }
		},
		resolveCondition = function(){
			return {
				loanTypes:function(DictService){
					return DictService.get('loanTypes');
				},
				timeRanges:function(DictService){
					return DictService.get("timeRanges");
				}
			}
		},
		resolveNavObjects = function(){
			return {
				user: function(AccountService){
					return AccountService.isLogin().then(function(data){
						return data;
					});
				},
				profile: function(AccountService){
					return AccountService.getProfile().then(function(profile){
						return profile;
					})
				}
			}
		};

		$stateProvider
			//acount module routes
			.state('home',{
				url:"/home",
				abstract:true,
				views:{
					'':{
						templateUrl:"/angular/home/partials/layout.html"
					},
					'nav@home': {
						templateUrl: "/angular/home/partials/nav.html",
						controller: "NavController",
						resolve:resolveNavObjects()
					}
				}
			})
			.state('home.loan',{
				url:"/loan",
				resolve:{
					preProjects:function($stateParams,DictService,LoanService){
						var homeTimeRanges = DictService.get('homeRanges');
						var startDate = new Date(homeTimeRanges[0].startDate);
						var endDate = new Date(homeTimeRanges[0].endDate);
						// // var startDate;
						// // var endDate;
						$stateParams.page = $stateParams.page || 1;
						return LoanService.getUnpayedList($stateParams.page,startDate,endDate);
					},
					projects: function($stateParams,DictService,LoanService){
						var homeTimeRanges = DictService.get('homeRanges');
						var startDate = new Date(homeTimeRanges[1].startDate);
						var endDate = new Date(homeTimeRanges[1].endDate);
						// // var startDate;
						// // var endDate;
						$stateParams.page = $stateParams.page || 1;
						return LoanService.getUnpayedList($stateParams.page,startDate,endDate);
					},
					laterProjects: function($stateParams,DictService,LoanService){
						var homeTimeRanges = DictService.get('homeRanges');
						var startDate = new Date(homeTimeRanges[2].startDate);
						var endDate = new Date(homeTimeRanges[2].endDate);
						// // var startDate;
						// // var endDate;
						$stateParams.page = $stateParams.page || 1;
						return LoanService.getUnpayedList($stateParams.page,startDate,endDate);
					},
					timeRanges: function(DictService) {
						return DictService.get('homeRanges');
					}
				},
				templateUrl:'/angular/home/partials/loan.html',
				controller:'HomeController'
			})
			.state('home.borrow',{
				url:"/borrow",
				resolve:{
					preProjects:function($stateParams,DictService,BLoanService){
						var homeTimeRanges = DictService.get('homeRanges');
						var startDate = new Date(homeTimeRanges[0].startDate);
						var endDate = new Date(homeTimeRanges[0].endDate);
						// // var startDate;
						// // var endDate;
						$stateParams.page = $stateParams.page || 1;
						return BLoanService.getUnpayedList($stateParams.page,startDate,endDate);
					},
					projects: function($stateParams,DictService,BLoanService){
						var homeTimeRanges = DictService.get('homeRanges');
						var startDate = new Date(homeTimeRanges[1].startDate);
						var endDate = new Date(homeTimeRanges[1].endDate);
						// // var startDate;
						// // var endDate;
						$stateParams.page = $stateParams.page || 1;
						return BLoanService.getUnpayedList($stateParams.page,startDate,endDate);
					},
					laterProjects: function($stateParams,DictService,BLoanService){
						var homeTimeRanges = DictService.get('homeRanges');
						var startDate = new Date(homeTimeRanges[2].startDate);
						var endDate = new Date(homeTimeRanges[2].endDate);
						// // var startDate;
						// // var endDate;
						$stateParams.page = $stateParams.page || 1;
						return BLoanService.getUnpayedList($stateParams.page,startDate,endDate);
					},
					timeRanges: function(DictService) {
						return DictService.get('homeRanges');
					}
				},
				templateUrl:'/angular/home/partials/borrow.html',
				controller:'HomeController'
			})
			
		    .state('login', {
		    	url: "/login",
		    	templateUrl: "angular/account/login/login.html",
		    	controller:'LoginController'
		    })
		    .state('signup', {
		    	url: "/signup",
		    	templateUrl: "angular/account/signup/signup.html"

		    })
				.state('retrieve_password', {
		    	url: "/retrieve_password",
		    	templateUrl: "angular/account/retrieve_password/retrieve_password.html",
		    	controller:'RetrievePasswordController'
		    })
		     // manage module routes
				.state('manage',{
					abstract:true,
					url:'/manage',
					views:{
						'':{
							templateUrl:"/angular/manage/common/partial/layout.html"
						},
						'nav@manage': {
							templateUrl: "/angular/manage/nav/nav.html",
							controller: "NavController",
							resolve:resolveNavObjects()
						},
						'menu@manage': {
							templateUrl:"/angular/manage/common/partial/menu.html"
						}
					}
				})
		    .state('manage.index',{
		    	url:"?startDate&endDate",
    			templateUrl:  "/angular/manage/index/index.html",
    			resolve: {
    				incomeStatistics: function(LoanService, $stateParams, $filter){
    					if(!$stateParams.startDate || !$stateParams.endDate) {
    						var currDate = new Date();
    						$stateParams.startDate = new Date(currDate.getFullYear(),currDate.getMonth(),1).getTime();
    						$stateParams.endDate = currDate.getTime();
    					}
              var startDate = $filter('date')(new Date(parseInt($stateParams.startDate)), 'yyyy-MM-dd');
              var endDate =  $filter('date')(new Date(parseInt($stateParams.endDate)), 'yyyy-MM-dd');
              return LoanService.statictics('income', startDate, endDate).then(function(data){
                return data;
              });
    				},
    				outcomeStatistics: function(LoanService, $stateParams, $filter){
    					if(!$stateParams.startDate || !$stateParams.endDate) {
                var currDate = new Date();
                $stateParams.startDate = new Date(currDate.getFullYear(),
                                          currDate.getMonth(),
                                          1).getTime();
                $stateParams.endDate = currDate.getTime();
              }
              var startDate = $filter('date')(new Date(parseInt($stateParams.startDate)), 'yyyy-MM-dd');
              var endDate =  $filter('date')(new Date(parseInt($stateParams.endDate)), 'yyyy-MM-dd');
              return LoanService.statictics('outcome', startDate, endDate).then(function(data){
                return data;
              });
    				}
    			},
    			controller: 'IndexController'
		    })

		    .state('fianceStatistics',{
		    	url:"/manage/fianceStatistics",
					templateUrl:  "/angular/manage/index/index.html",
				  controller: 'IndexController'

		    })

		    .state('manage.draftLoans',{
		    	url:"/loan/draft?page",
    			templateUrl: "/angular/manage/loan/draft/draft.html",
    			resolve:{
    				draftLoans:function(LoanService,$stateParams){
    					return LoanService.getDraft($stateParams.page || 1).then(function(data){
    						return data;
    					});
    				}
    			},
    			controller: "DraftLoanCtrl"
		    })
		    .state('manage.collectPending',{
		    	url:"/collect/pending?page&startDate&endDate&loanType",
    			templateUrl: "/angular/manage/collect/collect.html",
    			resolve:resolveObject("LoanService.getUnpayedList"),
    			controller: "CollectController"
		    })
		    .state('manage.collectDone',{
		    	url:"/collect/done?page&startDate&endDate&loanType",
    			templateUrl: "/angular/manage/collect/collect.html",
    			resolve:resolveObject("LoanService.getPayedList"),
    			controller: "CollectController"
		    })

		    .state('manage.allProjects',{
		    	url:"/projects/all?page&startDate&endDate&loanType",
    			templateUrl: "/angular/manage/project/project.html",
    			resolve:resolveObject("LoanService.getLoans"),
    			controller: "ProjectController"
		    })
 			.state('manage.normalProjects',{
		    	url:"/projects/normal?page&loanType",
    			templateUrl: "/angular/manage/project/project.html",
    			resolve:resolveObject("LoanService.getNormalLoans"),
    			controller: "ProjectController"
		    })
 			.state('manage.overdueProjects',{
		    	url:"/projects/overdue?page&loanType",
    			templateUrl: "/angular/manage/project/project.html",
    			resolve:resolveObject("LoanService.getOverdueLoans"),
    			controller: "ProjectController"
		    })
 			.state('manage.badbillProjects',{
		    	url:"/projects/badbill?page&loanType",
    			templateUrl: "/angular/manage/project/project.html",
    			resolve:resolveObject("LoanService.getBadbillLoans"),
    			controller: "ProjectController"
		    })
 		    .state('manage.completedProjects',{
		    	url:"/projects/completed?page&loanType",
    			templateUrl: "/angular/manage/project/project.html",
    			resolve:resolveObject("LoanService.getCompletedLoans"),
    			controller: "ProjectController"
		    })
		    .state('manage.searchProjects',{
		    	url:"/projects/search?page&type&keyword",
					templateUrl: "/angular/manage/project/project.html",
					resolve:{
						loans:function(LoanService,$stateParams){
				    		return LoanService.search($stateParams.type,$stateParams.keyword).then(function(data){
				    			return data;
				    		})
				    	},
						loanTypes:function(DictService){
							return DictService.get('loanTypes');
						},
						timeRanges:function(DictService){
							return DictService.get("timeRanges");
						}
					},
					controller: "ProjectController"
		    })
		    .state('manage.contact',{
		    	url:"/contact?page",
    			templateUrl: "/angular/manage/contact/contact.html",
    			resolve:{
						contacts:function(ContactService, $stateParams){
		    			return ContactService.getByPage($stateParams.page || 1).then(function(data){
    						return data;
    					});
		    		}
    			},
    			controller: "ContactController"
		    })
		    .state('manage.searchContact',{
		    	url:"/contact/search?type&keyword",
    			templateUrl: "/angular/manage/contact/contact.html",
    			resolve:{
						contacts:function(ContactService, $stateParams){
		    			return ContactService.search($stateParams.type,$stateParams.keyword).then(function(data){
			    			return data;
			    		})
		    		}
    			},
    			controller: "ContactController"
		    })
		    .state('manage.finance',{
				url: "/finance?startTime&endTime&summaries&cashes&projects",
				templateUrl: "/angular/manage/finance/finance.html",
				controller: "FinanceController",
				resolve:{
					financeRanges:function(DictService) {
						return DictService.get('financeRanges');
					},
					fiscalTypes:function(DictService) {
						return  DictService.get('fiscalTypes');
					},
					fiscalStatusTypes: function(DictService) {
						return DictService.get('fiscalStatusTypes');
					}
				}
			})
				.state('loan',{
					url:'/loan',
					templateUrl: "/angular/manage/common/partial/layout_simple.html",
					abstract:true

				})
				.state('loan.detail',{
					url:'?id',
					views:{
						'nav':{
							templateUrl: "/angular/manage/nav/nav.html",
							controller: "NavController",
							resolve:resolveNavObjects()
						},
						'':{
							templateUrl:"/angular/manage/common/contract/contract.html",
							resolve:{
								loan:function(LoanService,$stateParams){
									return LoanService.getLoan($stateParams.id).then(function(data){
										return data;
									})
								},
								paybacks:function(LoanService,$stateParams){
									return LoanService.getPaybacks($stateParams.id).then(function(data){
										return data;
									})
								},
								payments:function(LoanService,$stateParams){
									return LoanService.getPayments($stateParams.id).then(function(data){
										return data;
									})
								},
								attachments:function($q,LoanService,ContactService,$stateParams){
									var attachments = {};

									var defferrd = $q.defer();

									LoanService.getLoan($stateParams.id).then(function(loanData){

										ContactService.getAttachments(loanData.loaner.id).then(function(attachdata){
											attachments.br = attachdata;

										}).then(function(){
											if(loanData.assurer && loanData.assurer.id){

												ContactService.getAttachments(loanData.assurer.id).then(function(attachdata){
													attachments.gr = attachdata;
													defferrd.resolve(attachments);
												});
											}else{
												defferrd.resolve(attachments);
											}
										})
									})

									return defferrd.promise;
								}
							},
							controller:'ContractController'
						}
					}
				})
				.state('bloan',{
					url:'/bloan',
					templateUrl: "/angular/manage/common/partial/layout_simple.html",
					abstract:true

				})
				.state('bloan.detail',{
					url:'?id',
					views:{
						'nav':{
							templateUrl: "/angular/manage/nav/nav.html",
							controller: "NavController",
							resolve:resolveNavObjects()
						},
						'':{
							templateUrl:"/angular/borrow/common/partial/bcontract.html",
							resolve:{
								loan:function(BLoanService,$stateParams){
									return BLoanService.getLoan($stateParams.id).then(function(data){
										return data;
									})
								},
								paybacks:function(BLoanService,$stateParams){
									return BLoanService.getPaybacks($stateParams.id).then(function(data){
										return data;
									})
								},
								payments:function(BLoanService,$stateParams){
									return BLoanService.getPayments($stateParams.id).then(function(data){
										return data;
									})
								},
								attachments:function($q,BLoanService,ContactService,$stateParams){
									var attachments = {};

									var defferrd = $q.defer();

									BLoanService.getLoan($stateParams.id).then(function(loanData){

										ContactService.getAttachments(loanData.loaner.id).then(function(attachdata){
											attachments.br = attachdata;

										}).then(function(){
											if(loanData.assurer && loanData.assurer.id){

												ContactService.getAttachments(loanData.assurer.id).then(function(attachdata){
													attachments.gr = attachdata;
													defferrd.resolve(attachments);
												});
											}else{
												defferrd.resolve(attachments);
											}
										})
									})

									return defferrd.promise;
								}
							},
							controller:'BContractController'
						}
					}
				})
				.state('project',{
					url:'/project',
					views:{
						'nav@project':{
							templateUrl: "/angular/manage/nav/nav.html",
							controller: "NavController",
							resolve:resolveNavObjects()
						},
						'':{
							templateUrl:'/angular/manage/common/partial/layout_simple.html'
						},
						'wizard@project':{
							templateUrl:'/angular/manage/common/partial/wizard.html'
						}
					}

				})
  			.state('project.create',{
		    	url:"/create?ref",
					templateUrl: "/angular/manage/loan/create_loanDetail.html",
		    	resolve:_.extend(resolveSelectItems(),resolveLoan()),
		    	controller: "LoanFormCtrl"
		    })
		    .state('project.createMore',{
		    	url:"/create?ref#more",
					templateUrl: "/angular/manage/loan/create_loanInfo.html",
		    	controller:"LoanContactFormCtrl"
		    })
		 	 .state('project.createFinal',{
		    	url:"/create?ref#projectDetail",
		    	templateUrl: "/angular/manage/common/contract/contract.html",
		    	controller: "LoanDetailCtrl"
		    })
		 	 // 调整项目
		 	.state('project.modify',{
		    	url:"/:id/modify",
		    	templateUrl: "/angular/manage/loan/create_loanDetail.html",
		    	resolve:_.extend(resolveSelectItems(),resolveLoan()),
		    	controller: "LoanFormCtrl"

		    })
		    .state('project.modifyMore',{
		    	url:"/:id/modify#more",
		    	templateUrl: "/angular/manage/loan/create_loanInfo.html",
		    	controller: "LoanContactFormCtrl"

		    })
		    .state('project.modifyFinal',{
		    	url:"/:id/modify#final",
		    	templateUrl: "/angular/manage/common/contract/contract.html",
		    	resolve:resolveSelectItems(),
		    	controller: "ModifyLoanFinalCtrl"
		    })
		    .state('help',{
		    	url:"/help",
		    	templateUrl: "/angular/common/template/help.html"
		    })
				.state('account',{
					abstruct:true,
					url:"/account",
					resolve:{
						profile: function(AccountService){
							return AccountService.getProfile().then(function(profile){
								return profile;
							})
						}
					},
					views:{
						'':{
							templateUrl:"/angular/manage/common/partial/layout.html"
						},
						'nav@account': {
							templateUrl: "/angular/manage/nav/nav.html",
							controller: "NavController",
							resolve:resolveNavObjects()
						},
					}

				})
				.state('account.setting',{
					url:"/setting",
					views: {
						'menu': {
							templateUrl:"/angular/manage/common/partial/menu_account.html"
						}
					}
				})
				.state('account.setting.profile',{
					url:"/profile",
					views:{
						'@account':{
							templateUrl: '/angular/account/setting/profile.html',
							controller:'AccountSettingCtrl'
						}
					}

				})
				.state('account.setting.certification',{
					url:"/certification",
					views:{
						'@account':{
							templateUrl: '/angular/account/setting/certification.html',
							controller:'AccountSettingCtrl'
						}
					}
				})
				.state('account.setting.safety',{
					url:"/safety",
					views:{
						'@account':{
							templateUrl: '/angular/account/setting/safety.html',
							controller:'AccountSettingCtrl'
						}
					}
				})
				.state('account.setting.avatar',{
					url:"/avatar",
					views:{
						'@account':{
							templateUrl: '/angular/account/setting/avatar.html',
							controller:'AccountSettingCtrl'
						}
					}
				})

				/**
				*
				*Borrow 模块路由
				*/
				.state('borrow',{
		          url:"/borrow",
		          abstract:true,
		          views:{
								'':{
									templateUrl:"/angular/borrow/common/partial/layout.html"
								},
								'nav@borrow': {
									templateUrl: "/angular/manage/nav/nav.html",
									controller: "NavController",
									resolve:resolveNavObjects()
								},
								'menu@borrow': {
									templateUrl:"/angular/borrow/common/partial/menu.html"
								}
							}
		        })
				.state('borrow.index',{
		    	url:"?startDate&endDate",
    			templateUrl:  "/angular/borrow/index/index.html",
    			resolve: {
    				incomeStatistics: function(BLoanService, $stateParams, $filter){
    					if(!$stateParams.startDate || !$stateParams.endDate) {
    						var currDate = new Date();
    						$stateParams.startDate = new Date(currDate.getFullYear(),
    																		  currDate.getMonth(),
    																		  1).getTime();
    						$stateParams.endDate = currDate.getTime();
    					}
              var startDate = $filter('date')(new Date(parseInt($stateParams.startDate)), 'yyyy-MM-dd');
              var endDate =  $filter('date')(new Date(parseInt($stateParams.endDate)), 'yyyy-MM-dd');
              return BLoanService.statictics('income', startDate, endDate).then(function(data){
                return data;
              });
    				},
    				outcomeStatistics: function(BLoanService, $stateParams, $filter){
    					if(!$stateParams.startDate || !$stateParams.endDate) {
                var currDate = new Date();
                $stateParams.startDate = new Date(currDate.getFullYear(),
                                          currDate.getMonth(),
                                          1).getTime();
                $stateParams.endDate = currDate.getTime();
              }
              var startDate = $filter('date')(new Date(parseInt($stateParams.startDate)), 'yyyy-MM-dd');
              var endDate =  $filter('date')(new Date(parseInt($stateParams.endDate)), 'yyyy-MM-dd');
              return BLoanService.statictics('outcome', startDate, endDate).then(function(data){
                return data;
              });
    				}
    			},
    			controller: 'BIndexController'
		    })

		    .state('borrow.fianceStatistics',{
		    	url:"/fianceStatistics",
					templateUrl:  "/angular/borrow/index/index.html",
				  controller: 'BIndexController'

		    })
			.state('borrow.draft',{
		    	url:"/draft?page",
    			templateUrl: "/angular/borrow/bloan/partials/draft.html",
    			resolve:{
    				draftLoans:function(BLoanService,$stateParams){
    					return BLoanService.getDraft($stateParams.page || 1).then(function(data){
    						return data;
    					});
    				}
    			},
    			controller: "DraftBLoanCtrl"
		    })
				.state('bproject',{
					url:'/bproject',
					views:{
						'nav@bproject':{
							templateUrl: "/angular/manage/nav/nav.html",
							controller: "NavController",
							resolve:resolveNavObjects()
						},
						'':{
							templateUrl:'/angular/borrow/common/partial/b_layout_simple.html'
						},
						'wizard@bproject':{
							templateUrl:'/angular/borrow/common/partial/wizard.html'
						}
					}

				})
				.state('bproject.create',{
		    	url:"/create?ref",
					templateUrl: "/angular/borrow/bloan/partials/create_borrow_info.html",
		    	resolve:_.extend(resolveSelectItems(),resolveLoan()),
		    	controller: "BLoanFormCtrl"
		    })
		    .state('bproject.createMore',{
		    	url:"/create?ref#more",
					templateUrl: "/angular/borrow/bloan/partials/create_borrow_user.html",
		    	controller:"BLoanContactFormCtrl"
		    })
		 	 .state('bproject.createFinal',{
		    	url:"/create?ref#projectDetail",
		    	templateUrl: "/angular/borrow/common/partial/bcontract.html",
		    	controller: "BLoanDetailCtrl"
		    })
		 	 // 调整项目
		 	.state('bproject.modify',{
		    	url:"/:id/modify",
		    	templateUrl: "/angular/borrow/bloan/partials/create_borrow_info.html",
		    	resolve:_.extend(resolveSelectItems(),resolveLoan()),
		    	controller: "BLoanFormCtrl"

		    })
		    .state('bproject.modifyMore',{
		    	url:"/:id/modify#more",
		    	templateUrl: "/angular/borrow/bloan/partials/create_borrow_user.html",
		    	controller: "BLoanContactFormCtrl"

		    })
		    .state('bproject.modifyFinal',{
		    	url:"/:id/modify#final",
		    	templateUrl: "/angular/borrow/common/partial/bcontract.html",
		    	resolve:resolveSelectItems(),
		    	controller: "ModifyBLoanFinalCtrl"
		    })

				.state('borrow.repayPending',{
					url:"/repay/pending?page&startDate&endDate&loanType",
    			templateUrl: "/angular/borrow/repay/repay.html",
					resolve:resolveObject("BLoanService.getUnpayedList"),
    			controller: "RepayController"
				})
				.state('borrow.repayDone',{
					url:"/repay/done?page&startDate&endDate&loanType",
    			templateUrl: "/angular/borrow/repay/repay.html",
					resolve:resolveObject("BLoanService.getPayedList"),
    			controller: "RepayController"
				})
				.state('borrow.contact',{
		    	url:"/contact?page",
    			templateUrl: "/angular/manage/contact/contact.html",
    			resolve:{
						contacts:function(ContactService, $stateParams){
		    			return ContactService.getByPage($stateParams.page || 1).then(function(data){
    						return data;
    					});
		    		}
    			},
    			controller: "ContactController"
		    })
				.state('borrow.searchContact',{
		    	url:"/contact/search?type&keyword",
    			templateUrl: "/angular/manage/contact/contact.html",
    			resolve:{
						contacts:function(ContactService, $stateParams){
		    			return ContactService.search($stateParams.type,$stateParams.keyword).then(function(data){
			    			return data;
			    		})
		    		}
    			},
    			controller: "ContactController"
		    })
				.state('borrow.allProjects',{
		    	url:"/projects/all?page&startDate&endDate&loanType",
    			templateUrl: "/angular/borrow/bproject/bproject.html",
    			resolve:resolveObject("BLoanService.getLoans"),
    			controller: "BProjectController"
		    })
 			  .state('borrow.normalProjects',{
		    	url:"/projects/normal?page&loanType",
    			templateUrl: "/angular/borrow/bproject/bproject.html",
    			resolve:resolveObject("BLoanService.getNormalLoans"),
    			controller: "BProjectController"
		    })
 			  .state('borrow.overdueProjects',{
		    	url:"/projects/overdue?page&loanType",
    			templateUrl: "/angular/borrow/bproject/bproject.html",
    			resolve:resolveObject("BLoanService.getOverdueLoans"),
    			controller: "BProjectController"
		    })
 			  .state('borrow.badbillProjects',{
		    	url:"/projects/badbill?page&loanType",
    			templateUrl: "/angular/borrow/bproject/bproject.html",
    			resolve:resolveObject("BLoanService.getBadbillLoans"),
    			controller: "BProjectController"
		    })
 		    .state('borrow.completedProjects',{
		    	url:"/projects/completed?page&loanType",
    			templateUrl: "/angular/borrow/bproject/bproject.html",
    			resolve:resolveObject("BLoanService.getCompletedLoans"),
    			controller: "BProjectController"
		    })
		    .state('borrow.searchProjects',{
		    	url:"/projects/search?page&type&keyword",
					templateUrl: "/angular/borrow/bproject/bproject.html",
					resolve:{
						loans:function(BLoanService,$stateParams){
				    		return BLoanService.search($stateParams.type,$stateParams.keyword).then(function(data){
				    			return data;
				    		})
				    	},
						loanTypes:function(DictService){
							return DictService.get('loanTypes');
						},
						timeRanges:function(DictService){
							return DictService.get("timeRanges");
						}
					},
					controller: "BProjectController"
		    })
		    .state('borrow.finance',{
				url: "/finance?startTime&endTime&summaries&cashes&projects",
				templateUrl: "/angular/borrow/finance/finance.html",
				controller: "BFinanceController",
				resolve:{
					financeRanges:function(DictService) {
						return DictService.get('financeRanges');
					},
					fiscalTypes:function(DictService) {
						return  DictService.get('fiscalTypes');
					},
					fiscalStatusTypes: function(DictService) {
						return DictService.get('fiscalStatusTypes');
					}
				}
			})
			.state('credit',{
				abstract:true,
				url:"/credit",
				views:{
					'':{
						templateUrl:"/angular/credit/common/partial/layout.html"
					},
					'nav@credit': {
						templateUrl: "/angular/manage/nav/nav.html",
						controller: "NavController",
						resolve:resolveNavObjects()
					},
					'menu@credit': {
						templateUrl:"/angular/credit/common/partial/menu.html"
					}
				}
			})
			.state('credit.index',{
				url:""
			})
			.state('credit.contact',{
				url:"/contact",
				templateUrl:"/angular/credit/contact/contact.html"
			})
			.state('credit.pawn',{
				url:"/pawn",
				templateUrl:"/angular/credit/pawn/pawn.html"
			})
			.state('contact',{
				abstract:true,
				url:'/contact',
				views:{
					'':{
						templateUrl:"/angular/manage/common/partial/layout.html"
					},
					'nav@contact': {
						templateUrl: "/angular/manage/nav/nav.html",
						controller: "NavController",
						resolve:resolveNavObjects()
					},
					'menu@contact': {
						templateUrl:"/angular/contact/partials/menu.html"
					}
				}
		    })
		    .state('contact.index',{
		    	url:"?page",
    			templateUrl: "/angular/manage/contact/contact.html",
    			resolve:{
						contacts:function(ContactService, $stateParams){
		    			return ContactService.getByPage($stateParams.page || 1).then(function(data){
    						return data;
    					});
		    		}
    			},
    			controller: "ContactController"
		    })
		    .state('contact.search',{
		    	url:"/search?type&keyword",
    			templateUrl: "/angular/manage/contact/contact.html",
    			resolve:{
						contacts:function(ContactService, $stateParams){
		    			return ContactService.search($stateParams.type,$stateParams.keyword).then(function(data){
			    			return data;
			    		})
		    		}
    			},
    			controller: "ContactController"
		    })

	}]);

});
