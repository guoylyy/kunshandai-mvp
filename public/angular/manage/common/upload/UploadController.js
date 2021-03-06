define(['app','underscore'],function(app,_){
	return app.controller('UploadController', function($scope,$modalInstance,UploadService,SweetAlert,type){

		$scope.type = type;

  		$scope.attachmentType = 'certification';

		$scope.fileList = [];

		$scope.attchTypes = UploadService.getAttachmentTypes();

		typeInit();

		function typeInit() {
			
			if(type === '抵押物'){
				
				$scope.attchTypes = [{value:'inspection',text:"现场考察"},
									 {value:'certification',text:"证件"},
									 {value:'other',text:"其他"}];

				$scope.attachmentType = 'other';
			}
		}
		// $scope.fileStatus = UploadService.getFileStatus();

		$scope.finish= function () {
			_.each($scope.fileList,function(file,index){
				if(file.error){
					delete $scope.fileList[index];
				}
			})
			$scope.fileList = _.compact($scope.fileList);
    		$modalInstance.close($scope.fileList);
  		};	


		$scope.$watch('files', function () {
			if($scope.files && $scope.files.length){
				_.each($scope.files,function(file){
					file.attachmentType = $scope.attachmentType;

				})
				$scope.fileList = _.union($scope.fileList,$scope.files);
				UploadService.upload($scope.files,$scope.attachmentType);
			}

		});


		$scope.cancel = function () {
		    if($scope.fileList.length){
		    	 SweetAlert.swal({
				   title: "确定取消上传附件?",
				   text: "已上传的附件将被删除",
				   type: "warning",
				   showCancelButton: true,
				   confirmButtonColor: "#DD6B55",
				   confirmButtonText: "确定",
				},function(isConfirm){
					if(isConfirm){
						$modalInstance.dismiss('cancel');
					}
				});
	    	}else{
	    		$modalInstance.dismiss('cancel');
	    	}

		   };
	});
});
