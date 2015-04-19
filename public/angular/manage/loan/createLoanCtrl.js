'use strict';

define(['app',"underscore"],function(app,_) {

	return app.controller('CreateLoanCtrl', 
		["$scope","$rootScope","$location","$q","LoanService","ContactService",'DictService','$state',
		'loanTypes','repayTypes','steps','$modal','SweetAlert',
		function($scope,$rootScope,$location,$q,LoanService,ContactService,DictService,$state,loanTypes,repayTypes,steps,$modal,SweetAlert){
		

		$scope.loanTypes = (typeof loanTypes !== 'undefined' )? loanTypes.data : {};
		$scope.repayTypes = (typeof repayTypes !== 'undefined' )? repayTypes.data : {};

		$rootScope.stepActive = steps;

		$scope.nav = function(direction){
			if(direction === 'prev'){
				$state.go('createLoan');
			}else if(direction === 'next'){
				$state.go('createLoanContact');
			}
			
		};
		
		$scope.$watch('loanInfo.payWay',function(){
			circleChange();
			dateChange();
		});

		$scope.$watch('loanInfo.spanMonth',function(){
			circleChange();
			dateChange();
		});
		
		$scope.$watch('loanInfo.startDate',function(){
			dateChange();
		});

		var circleChange = function(){
			if($scope.loanInfo.payWay === 'xxhb' || $scope.loanInfo.payWay === 'dqhbfx'){
				$scope.loanInfo.payCircle = $scope.loanInfo.spanMonth;
				$scope.loanInfo.payTotalCircle = 1;
			}
		};
		var dateChange = function(){
			var date = new Date($scope.loanInfo.startDate);
			date.setMonth(date.getMonth()+ parseInt($scope.loanInfo.spanMonth));	
			$scope.loanInfo.endDate = date;
			if($scope.loanInfo.payWay === 'xxhb' || $scope.loanInfo.payWay === 'dqhbfx'){
				$scope.loanInfo.firstPayDate = $scope.loanInfo.endDate ;
			}
		};

		$scope.createContract = function(){
			
			var loaner = ContactService.getLoaner(),
				assurer = ContactService.getAssurer(),
				loan = LoanService.getLocal();
			// var rcLoaner = _.extend({},loaner),
			// 	rcASssurer = _.extend({},assurer),
			// 	rcLoan = _.extend({},rcLoan);

			$q.all([ContactService.create(loaner), ContactService.create(assurer),
				LoanService.create(loan)])

			.then(function(results){
				
				var contract = {};
				loaner.objectId 	= contract.loanerId 	= results[0].objectId;				
				assurer.objectId 	= contract.assurerId 	= results[1].objectId;
				// contract.loanId 	= results[2].objectId;
				loan.objectId 		= contract.loanId 		= results[2].id;

				console.log(results[0], results[1], results[2]);

				return LoanService.generate(contract);
			
			}).then(function(){
				
				$state.go('contractCreated');
				
			}).catch(function(){
			
				// $scope.br.attachments = rcLoaner.attachments;
				// $scope.gr.attachments = rcASssurer.attachments;
				SweetAlert.error("新建放款失败", "服务器出了点小差", "error");
			})
		};

		

		$scope.open = function($event,opened) {
		    
		    $event.preventDefault();
		    $event.stopPropagation();
		    $scope.calendar[opened] = true;
		};

		$scope.uploadAttachment = function(contact){
			var modalInstance = $modal.open({
				templateUrl: '/angular/manage/common/upload/uploadModal.html',
				controller:'UploadController',
				size:'lg',
				resolve:{
					contact:function(){
						return contact;
					}
				}
			});
			modalInstance.result.then(function (fileList) {
		      	if(contact === '借款人'){
					$scope.br.attachments = _.union($scope.br.attachments,fileList);
				}else if(contact == '担保人'){
					$scope.gr.attachments = _.union($scope.gr.attachments,fileList);
				}

		    }, function () {
		      
		      $log.info('Modal dismissed at: ' + new Date());
		    
		    });
		};

		$scope.selectContact = function(){
			
		}

		$scope.removeAttach = function(contact,index){
			if(contact === 'br'){
				// var index = _.findIndex($scope.br.attachments,index);
				delete($scope.br.attachments[index]);
				$scope.br.attachments = _.compact($scope.br.attachments);
			}else if(contact === 'gr'){
				// var index = _.findIndex($scope.gr.attachments,index);
				delete($scope.gr.attachments[index]);
				$scope.br.attachments = _.compact($scope.gr.attachments);
			}
			
		};

		$scope.activeLoan = function(){

			LoanService.assure($scope.loanInfo.objectId).then(function(res){

				$scope.loanInfo.actived = true;
				SweetAlert.success("放款成功", "");

			},function(res){
				$scope.loanInfo.actived  = false;
				SweetAlert.error("放款失败", "服务器内部错误");
			});

		}

		$scope.calendar={};
		
		$scope.format = 'yyyy-MM-dd';

		$scope.br = ContactService.getLoaner();
		
		$scope.gr = ContactService.getAssurer();
		
		$scope.loanInfo = LoanService.getLocal();

		
	}]);
});