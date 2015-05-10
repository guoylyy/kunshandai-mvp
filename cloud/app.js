/**
 * @author globit
 * @email  yiliangg@foxmail.com
 * @version [v1]
 */
var express = require('express');
var app = express();
var ejs = require('ejs');
var expressValidator = require('express-validator');
var Mailgun = require('mailgun').Mailgun;
var util = require('util');
var expressLayouts = require('express-ejs-layouts');
var moment = require('moment');
var _ = require('underscore');
var fs = require('fs');
var avosExpressHttpsRedirect = require('avos-express-https-redirect');
var crypto = require('crypto');
var avosExpressCookieSession = require('avos-express-cookie-session');

var mutil = require('cloud/mutil.js');
var mloan = require('cloud/mloan.js');
var mcontact = require('cloud/mcontact.js');
var mconfig = require('cloud/mconfig.js');
var mlog = require('cloud/mlog.js');
var account = require('cloud/account.js');
var config = require('cloud/config.js');
var _s = require('underscore.string');

var LoanRecord = AV.Object.extend('LoanRecord');
var LoanPayBack = AV.Object.extend('LoanPayBack');

// App 全局配置
if (__production) {
    app.set('views', 'cloud/views');    
} else {
    app.set('views', 'cloud/views');
}
// app.set('views', 'app/angular/account');
// app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');        //将渲染引擎设为html
app.use(express.bodyParser());        // 读取请求body的中间件
app.use(expressValidator);
app.use(avosExpressHttpsRedirect());
app.use(express.cookieParser(config.cookieParserSalt)); //还不明白是干什么的
app.use(avosExpressCookieSession({    //设置 cookie
    cookie: { 
        maxAge: 3600000 
    }, 
    fetchUser: true
}));
app.use(expressLayouts);
app.use(app.router);
app.use(express.static('public'));  //public
/**
 * 主页路由器,用于渲染前端框架入口页面
 */
app.get('/', function (req,res){
  res.redirect('/home');
});
app.get('/home',function(req, res){
  if(account.isLogin()){
    res.redirect('/manage');
  }else{
    res.redirect('/login');
  }
});
app.get('/index',function(req, res){
  res.render('guest_layout.ejs');
});
app.get('/login', function(req, res){
  if(account.isLogin()){
     res.redirect('/manage');
     return;
  }
  res.render('account.ejs');
});
app.get('/signup', function(req, res){
  if(account.isLogin()){
     res.redirect('/manage');
     return;
  }
  res.render('account.ejs');
});
app.get('/manage', function(req, res){
  var user = account.isLogin();
  if(!user){
    res.redirect('/login');
    return;
  }
  res.render('manage.ejs',{user:user.attributes});
});
app.get('/manage/*', function(req, res){
  var user = account.isLogin();
  if(!user){
    res.redirect('/login');
    return;
  }
  res.render('manage.ejs',{user:user.attributes});
});

app.get('/loan', function(req, res){
  var user = account.isLogin();
  if(!user){
    res.redirect('/login');
    return;
  }
  res.render('empty_layout.ejs',{user:user.attributes});
});
app.get('/loan/:id/modify', function(req, res){
  var user = account.isLogin();
  if(!user){
    res.redirect('/login');
    return;
  }
  res.render('modify_loan.ejs',{user:user.attributes});
});

app.get('/createLoan', function(req, res){
 var user = account.isLogin();
  if(!user){
    res.redirect('/login');
    return;
  }
  res.render('create_loan.ejs',{user:user.attributes});
});
app.get('/help', function(req, res){
  res.render('help.ejs');
});

// app.use('/styles',express.static('public/styles'));
// app.use(express.static('public/lib'));
// app.all('/*', function(req, res, next) { 
//     // res.render('empty_layout.ejs');
//     res.sendFile('index.html', { root: __dirname + '/html' });
// });

/***************************************************
 * 账号相关的操作
 **************************************************/
app.get(config.baseUrl +'/account/logout', function(req, res){
  AV.User.logOut();
  mutil.renderSuccess(res);
});

app.post(config.baseUrl +'/account/login', function(req, res){
  var username = req.body.mobilePhoneNumber;
  var password = req.body.password;
  if(account.isLogin()){
    AV.User.logOut();
  }
  AV.User.logIn(username, password,{
      success:function(user){
        res.json(user);
      },
      error:function(user, error){
        mutil.renderError(res, error);
      }
  });
});

//如果用户已登录，返回用户信息
app.get(config.baseUrl + '/account/isLogin', function(req, res){
  account.isLogin() ? res.json(account.isLogin()):mutil.renderResult(res, false, 210);
});

//注册
app.post(config.baseUrl + '/account/register', function (req, res) {
  if(account.isLogin()){
    AV.User.logOut();
  }
  var mobilePhoneNumber = req.body.mobilePhoneNumber;
  var password = req.body.password;
  var user = new AV.User();
  user.set('password', password);
  user.set('username', mobilePhoneNumber);
  user.set('mobilePhoneNumber', mobilePhoneNumber);
  user.signUp(null).then(function(user){
    res.json(user); //注册过后会发送一条短信给该注册用户, leancloud 后台配置
  },function(error){
    mutil.renderError(res, error);
  });
});

//发送手机验证码
app.get(config.baseUrl + '/account/requestMobilePhoneVerify', function (req, res){
  var u = check_login();
  var mobilePhoneNumber = u.get('mobilePhoneNumber');
  AV.User.requestMobilePhoneVerify(mobilePhoneNumber).then(function(){
    mutil.renderSuccess(res);
  }, function(error){
      mutil.renderError(res, error);
  });
});

//验证用户手机收到的验证码
app.post(config.baseUrl + '/account/verifyUserMobilePhoneNumber', function (req, res){
  var code = req.body.code;
  //console.log(code);
  AV.User.verifyMobilePhone(code).then(function(){
    mutil.renderSuccess(res);
  },function(error){
    mutil.renderError(res, error);
  });
});

//发送验证邮件
app.get(config.baseUrl + '/account/requestEmailVerify', function (req, res){
  var email = req.query.email;
  AV.User.requestEmailVerfiy(email).then(function () {
      mutil.renderSuccess(res);
    }, function(error){
      mutil.renderError(res, error);
  });
});

//更新用户信息
app.put(config.baseUrl + '/account/:id', function (req, res){
  //姓名 - 邮箱 - 个人title - 性别 - qq - wechat
  var u = check_login(res);
  var user = AV.Object.createWithoutData('_User', req.params.id);
  user.fetch().then(function(ruser){
    ruser.set('name', req.body.name);
    ruser.set('email', req.body.email);
    ruser.set('title', req.body.title);
    ruser.set('gender', req.body.gender);
    ruser.set('qq', req.body.qq);
    ruser.set('wechat', req.body.wechat);
    ruser.save().then(function(suser){
      mutil.renderData(res, suser);
    },function(error){
      mutil.renderError(res, error);
    });
  })
  mutil.renderSuccess(res);
});

//发送短信验证码
app.post(config.baseUrl + '/account/requestResetPasswordBySmsCode', function (req, res){
  var mobilePhoneNumber = req.body.mobilePhoneNumber;
  AV.User.requestPasswordResetBySmsCode(mobilePhoneNumber).then(function(){
    mutil.renderSuccess(res);
  }, function(error){
    mutil.renderError(res, error);
  })
});
//通过短信验证码重新新密码
app.post(config.baseUrl + '/account/resetPasswordBySmsCode', function (req, res){
  var npassword = req.body.password;
  var code = req.body.code;
  AV.User.resetPasswordBySmsCode(code, npassword).then(function(){
    mutil.renderSuccess(res);
  },function(error){
    mutil.renderError(res, error);
  })
});

/**********************************************
 * 贷款项目相关操作
 */
app.get(config.baseUrl + '/loan/search', function(req, res){
  var u = check_login(res);
  var query = new AV.Query('Loan');
  var type = req.query.type;
  var key = req.query.key;
  query.equalTo('owner', u);
  query.include('loaner');
  query.include('assurer');
  query.ascending('currPayDate');
  if(type == 'name'){
    query.startsWith('numberWithName', key);
    listLoan(res, query, 1);
  }else if(type == 'id'){
    query.startsWith('numberWithName', key);
    listLoan(res, query, 1);
  }else{
    mutil.renderError(res, {code:500, message:'参数错误!'});
  }
});

app.get(config.baseUrl + '/loan/:id', function (req, res){
  var u = check_login(res);
  var query = new AV.Query('Loan');
  query.equalTo('owner', u);
  query.equalTo('objectId', req.params.id);
  query.include('loaner');
  query.include('assurer');
  query.find().then(function(data){
    if(data.length !=1){
      mutil.renderError(res, {code:404, message:'找不到对象!'});
    }
    mutil.renderData(res,transformLoanDetails(data[0]));
  },function(error){
    mutil.renderError(res, error);
  });
});

app.delete(config.baseUrl + '/loan/:id', function (req, res){
  var u = check_login(res); 
  var loan = AV.Object.createWithoutData('Loan', req.params.id);
  loan.fetch().then(function(l){
    console.log(u);
    if(!l.id){
      mutil.renderError(res, {code:404, message:'找不到对象!'});
    }
    else if(l.get('status') != mconfig.loanStatus.draft.value){
      mutil.renderError(res, {code:500, message:'不能删除正在还款的项目'});
    }else{
      if(u.id == l.get('owner').id){
        //delete
        AV.Object.destroyAll([l]).then(function(){
         mutil.renderSuccess(res);
        },function(error){
         mutil.renderError(res, error);
        });
      }else{
        mutil.renderError(res, {code:510, message:'你没有权限删除这个对象'});
      }
    }
  },function(error){
    mutil.renderError(res, error);
  });
});

//更新项目 - draft 项目可以更新
app.put(config.baseUrl + '/loan/:id', function (req, res){
  var u = check_login(res);
  var loan = AV.Object.createWithoutData('Loan', req.params.id);
  loan.fetch().then(function(l){
    if(!l || l.get('status')==undefined){
      mutil.renderError(res, {code:404, message:'找不到对象!'});
    }else{
      if(l.get('status') != mconfig.loanStatus.draft.value){
        mutil.renderError(res,{code:400, message:'项目已进入还款阶段，不可更新！'});
      }else{
        n_loan = mloan.updateLoan(l, req.body);
        n_loan.save().then(function(nloan){
          mutil.renderData(res, transformLoanDetails(nloan));
        },function(error){
          mutil.renderError(res, error);
        });
      }
    }
  }, function(error){
    mutil.renderError(res, error);
  });
});

//查询放款记录
app.get(config.baseUrl + '/loan/:id/payments', function (req, res){
  var u = check_login(res);
  var loan = AV.Object.createWithoutData('Loan', req.params.id);
  loan.fetch().then(function(l){
    if(!l || l.get('status')==undefined){
      mutil.renderError(res, {code:404, message:'找不到对象!'});
    }else{
     var query = l.relation("loanRecords").query();
     query.find({
       success: function(list){
         mutil.renderData(res,list);
       },
       error: function(error){
         mutil.renderError(res, error);    
       }
     });
    }
  },function(error){
    mutil.renderError(res, error);
  });
});

//查询还款记录
app.get(config.baseUrl + '/loan/:id/paybacks', function (req, res){
  var u = check_login(res);
  var loan = AV.Object.createWithoutData('Loan', req.params.id);
  loan.fetch().then(function(l){
    if(!l || l.get('status')==undefined){
      mutil.renderError(res, {code:404, message:'找不到对象!'});
    }else{
      var query = l.relation("loanPayBacks").query();
      query.find({
        success: function(list){
          mutil.renderData(res,list);
        },
        error: function(error){
          mutil.renderError(res, error);    
        }
      });
    }
  },function(error){
    mutil.renderError(res, error);
  });
});

//新建一个贷款项目
app.post(config.baseUrl +'/loan/create_loan', function (req, res){
  var u = check_login(res);
  var loan = mloan.createBasicLoan(req.body, u);
  loan.save().then(function(r_loan){
    res.redirect(config.baseUrl + '/loan/' + r_loan.id);
  }, function(error){
    mutil.renderError(res, error);
  });
});

//生成项目时候初次记录生成放款
app.post(config.baseUrl + '/loan/generate_bill', function (req, res){
  var u = check_login(res);
  var loanId = req.body.loanId;
  var loanerId = req.body.loanerId;
  var assurerId = req.body.assurerId;
  var loanPawnId = req.body.loanPawnId;
  var loan = AV.Object.createWithoutData('Loan',loanId);
  var loaner = AV.Object.createWithoutData('Contact',loanerId);
  
  var isModifiedLoan = req.body.isModifiedLoan;

  loan.fetch().then(function(floan){
    if(floan.get('status') == undefined){
      mutil.renderError(res, {code:404, message:'找不到对象!'});
    }else{
      floan.set('isModifiedLoan', isModifiedLoan);
      //判断是否已经有放款记录,如果有删除掉
      if(assurerId){
        var assurer = AV.Object.createWithoutData('Contact',assurerId);
        floan.set('assurer',assurer);
      }
      if(loanPawnId){
        var pawn = AV.Object.createWithoutData('LoanPawn', req.body.loanPawnId);
        floan.set('pawn', pawn);
      }
      if(isModifiedLoan){
        floan.set('preLoanData', req.body.preLoanData);
        floan.set('version', req.body.preLoanData.version + 1);
      }else{
        floan.set('version', 0);
      }
      if(loaner){
        if(floan.attributes.status != mconfig.loanStatus.draft.value){
          mutil.renderError(res,{code:400, message:"项目已经处于还款状态!"});
        }else{
          loaner.fetch().then(function(rloaner){
            floan.set('loaner',loaner);
            floan.set('numberWithName', rloaner.get('name') + floan.get('serialNumber'));
            var query = floan.relation("loanRecords").query();
            query.destroyAll().then(function(){
              generateLoanRecord(floan,res);
            });
          });
        }
      }else{
        mutil.renderError(res,{code:400, message:"贷款人缺失！"});
      }
    }
  });
});

function generateLoanRecord(floan, res){
  var lr = mloan.calculateLoanRecord(floan);//生成放款记录
  lr.save().then(function(rlr){
    var lrRelation = floan.relation('loanRecords');
    lrRelation.add(rlr);
    floan.save().then(function(data){
      mutil.renderData(res,{
        loan: transformLoan(data),
        loanRecord: rlr
      });
    },function(error){
      mutil.renderError(res, error);
    });
  },
    function(error){
      mutil.renderError(res,{code:400, message:'生成放款记录失败!'});
  });
};

//确认放款，进入还款阶段
app.post(config.baseUrl + '/loan/assure_bill', function (req, res){
  var u = check_login(res);
  var loanId = req.body.loanId;
  var outMoney = parseFloat(req.body.outMoney); //实际放款金额
  //生成放款记录
  var loan = AV.Object.createWithoutData('Loan', loanId);
  loan.fetch().then(function(floan){
    if(floan.get('status') == undefined){
      mutil.renderError(res, {code:404, message:'找不到对象!'});
    }else{
      if(floan.attributes.status != mconfig.loanStatus.draft.value){
          mutil.renderError(res,{code:400, message:"项目已经处于还款状态!"});
      }else{
      mlog.log('正在生成还款任务');
      var loanPayBacks = mloan.calculatePayBackMoney(floan);
      mlog.log('开始存储还款任务');
      LoanPayBack.saveAll(loanPayBacks,{
        success: function(lpbs){
          var lpbRelation = floan.relation('loanPayBacks');
          lpbRelation.add(loanPayBacks);
          floan.set('status',mconfig.loanStatus.paying.value);
          var lrRelation = floan.relation('loanRecords');
          lrRelation.query().find().then(function(lrs){
            if(lrs.length == 1){
              var record = lrs[0];
              console.log(outMoney);
              record.set('outMoney', outMoney);
              record.set('payDate', new Date());
              record.set('loan', floan);
              record.set('isPayed', true);
              record.save().then(function(r_record){
                floan.save().then(function(data){
                    res.redirect(config.baseUrl + '/loan/' + data.id);
                  },function(error){
                  mutil.renderError(res,error);
                }); 
              });
            }
          });
        },
        error: function(error){
          mutil.renderError(res,error);
        }
      });
      }
    }
  });
});

/*******************************************
* 项目查询相关接口
* 已完成:
*   1. 分页列出所有项目（不包括草稿项目)
*   2. 分页列出草稿项目
*******************************************/

//列出贷款项目
app.get(config.baseUrl + '/loan/list/:listType/:pn', function (req, res){
  var u = check_login(res);
  var pageNumber = req.params.pn;
  var query = new AV.Query('Loan');
  query.include('loaner');
  query.include('assurer');
  query.equalTo('owner', u);
  query.ascending('currPayDate');
  if(req.query.loanType){
      query.equalTo('loanType', req.query.loanType); //贷款抵押类型过滤
  }
  if(req.params.listType == 'draft'){
    query.equalTo('status', mconfig.loanStatus.draft.value);
  }else{
    query.include('loanPayBacks');
    query.notEqualTo('status', mconfig.loanStatus.draft.value); //贷款抵押类型过滤
    var now = moment();
    if(req.params.listType == mconfig.loanListTypes.normal.value){
      query.lessThanOrEqualTo('currPayDate', now.add(1, 'month').toDate());
    }else if(req.params.listType == mconfig.loanListTypes.overdue.value){
      query.greaterThan('currPayDate', now.add(1, 'month').toDate());
      query.lessThanOrEqualTo('currPayDate', now.add(3, 'month').toDate());
    }else if(req.params.listType == mconfig.loanListTypes.badbill.value){
      query.greaterThan('currPayDate', now.add(3, 'month').toDate());
    }else if(req.params.listType == mconfig.loanListTypes.completed.value){
      query.equalTo('status', mconfig.loanStatus.completed.value);
    }
  }
  listLoan(res, query, pageNumber);
});

//还款管理列表
//目前列出还款金额是以当日为节点计算需要还款的金额
app.get(config.baseUrl + '/loan/payBack/list/:pn', function (req, res){
  var pageNumber = req.params.pn;
  var u = check_login(res);
  
  //过滤条件设置
  var loanQuery = new AV.Query('Loan');
  loanQuery.equalTo('status', mconfig.loanStatus.paying.value);
  loanQuery.equalTo('owner', u);
  if(req.query.loanType)
    loanQuery.equalTo('loanType', req.query.loanType); //贷款抵押类型过滤
  var query = new AV.Query('LoanPayBack');
  if(req.query.startDate)
    query.greaterThanOrEqualTo('payDate', req.query.startDate); 
  if(req.query.endDate)
    query.lessThanOrEqualTo('payDate', req.query.endDate);
  query.equalTo('status', parseInt(req.query.status)); //贷款状态过滤
  query.include(['loan.loaner']);
  query.matchesQuery('loan', loanQuery);

  var totalPageNum = 1;
  var resultsMap = {};
  query.ascending('payDate');
  query.count().then(function(count){
    totalPageNum = parseInt(count / mconfig.pageSize) + 1;
    resultsMap['totalPageNum'] = totalPageNum;
    resultsMap['totalNum'] = count;
    resultsMap['pageSize'] = mconfig.pageSize;
  }).then(function(){
      if(pageNumber > resultsMap.totalPageNum){
        resultsMap['values'] = [];
        mutil.renderData(res, resultsMap);
      }else{
        query.skip(pageNumber*mconfig.pageSize - mconfig.pageSize);
        query.limit(mconfig.pageSize);
        query.find({
          success: function(lpbList){
            var fList = [];
            for (var i = 0; i < lpbList.length; i++) {
              fList.push(concretePayBack(lpbList[i], lpbList[i].get('loan'), 0));
            };
            resultsMap['values'] = fList;
            mutil.renderData(res, resultsMap);
          },
          error: function(error){
            mutil.renderError(res, error);
          }
        });
      }
  });
}); 

//还款:不能还最后一期
app.post(config.baseUrl + '/loan/payBack/:id', function (req, res){
  //acl
  var payBackId = req.params.id;
  var loanPayBack = AV.Object.createWithoutData('LoanPayBack', payBackId);
  loanPayBack.fetch().then(function(p){
    var l = p.get('loan');
    l.fetch().then(function(loan){
      if(p.get('order') == loan.get('payTotalCircle')){
        mutil.renderError(res, {code:500, message:'这是最后一期还款，请跳转到结清'});
      }else{
        p.set('payBackMoney', req.body.payBackMoney);
        p.set('payBackDate', new Date(req.body.payBackDate));
        p.set('status',mconfig.loanPayBackStatus.completed.value);
        p.save().then(function(np){
          var query = new AV.Query('LoanPayBack');
          query.equalTo('order', p.get('order') + 1);
          query.equalTo('loan', p.get('loan'));
          query.ascending('payDate');
          query.find({
            success:function(pbs){
              if(pbs.length == 1){
                var pb = pbs[0];
                pb.set('status', mconfig.loanPayBackStatus.paying.value);
                pb.save().then(function(npb){
                  mutil.renderData(res, concretePayBack(pb, loan, 0));
                });
              }else if(pbs.length==0 && p.get('order') > 0){
                mutil.renderSuccess(res);
              }else{
                mutil.renderError(res, {code:500, message:'内部错误!'});
              }
            },
            error: function(error){
              mutil.renderError(res, error);
            }
          });
        });
      }
    });
  },
  function(error){
    mutil.renderError(res, error);
  });

});

//计算还款金额: 每次应还的钱
app.post(config.baseUrl + '/loan/payBack/:id/bill', function (req, res){
  var payDate = req.body.payDate;
  //根据还款时间计算应还金额
  //判断是按天计算利息还是按月计算违约金 
  var loanPayBack = AV.Object.createWithoutData('LoanPayBack', req.params.id);
  loanPayBack.fetch().then(function(pb){
    var l = pb.get('loan');
    l.fetch().then(function(loan){
      if(pb.get('order') == loan.get('payTotalCircle')){
        mutil.renderError(res, {code:500, message:'这是最后一期还款，请跳转到结清'});
      }else{
        var overdueMoney = calculateOverdueMoney(loan, pb.get('payDate'), req.body.payBackDate);
        mutil.renderData(res, concretePayBack(pb, loan, overdueMoney));
      }
    });
  },function(error){
    mutil.renderError(res, error);
  });
});

//结清账单生成，计算结清需要付钱的钱
app.get(config.baseUrl + '/loan/payBack/:loanId/finish', function (req, res){
  //接受项目id，获取结清账单
  var u = check_login(res);
  var loan = AV.Object.createWithoutData('Loan', req.params.loanId);
  var payDate = new moment(req.body.payDate);
  loan.fetch().then(function(rLoan){
    var loanStartDate = new moment(rLoan.get('startDate'));
    if(payDate.diff(loanStartDate) <= 0){
      return mutil.renderError(res, {code:500, message:'还款时间不能早于项目开始时间!'});
    }
    if(!req.query.interestCalType){
      return mutil.renderError(res, {code:500, message:'缺少还款类型!'}); 
    }
    if(rLoan.get('owner').id != u.id){
      mutil.renderError(res, {code:500, message:'访问了没有权限的项目!'});
    }else{
      var relation = rLoan.relation('loanPayBacks');
      var q = relation.query();
      q.notEqualTo('status',mconfig.loanPayBackStatus.completed.value);
      q.notEqualTo('status',mconfig.loanPayBackStatus.closed.value);
      q.find().then(function(pbs){
        var totalInterests = 0;
        var totalPayMoney = 0;
        var currentStep = 1; //当前周期数
        for (var i = 0; i < pbs.length; i++) {
          totalInterests += pbs[i].get('interestsMoney');
          totalPayMoney  += pbs[i].get('payMoney');
          if(pbs[i].get('order') > currentStep && pbs[i].get('status') == mconfig.loanPayBackStatus.paying.value){
            currentStep = pbs[i].get('order');
          }
        };
        totalPayMoney = totalPayMoney - totalInterests;
        var params = {
          currDate: req.query.payDate,
          currentStep : currentStep,
          interestCalType: req.query.interestCalType
        };
        var rc = mloan.calculateFinishBillParms(rLoan, params);

        rc.income.amount = totalPayMoney;//还款中未还的金额
        //这两种还款需要加入本金
        if(rLoan.get('payWay') == mconfig.payBackWays.zqcxhb.value || 
              rLoan.get('payWay') == mconfig.payBackWays.zqmxhb.value){
          rc.income.amount = rLoan.get('amount');
        }
        rc = mloan.calBillSum(rc);
        mutil.renderData(res, rc);  
      },function(error){
        mutil.renderError(res, error);
      });
    }
  });
});

//结清项目
app.post(config.baseUrl + '/loan/payBack/:id/finish', function (req, res){
  var u = check_login(res);
  var loan = AV.Object.createWithoutData('Loan', req.params.id);
  loan.fetch().then(function(rLoan){
    if(rLoan.get('status') != mconfig.loanStatus.paying.value){
      mutil.renderError(res, {code:500, message:'项目状态错误!'});
    }else{
      rLoan.set('finishBill', req.body.payBackData);
      rLoan.set('status', mconfig.loanStatus.completed.value);
      rLoan.set('payedMoney', rLoan.get('payedMoney') + req.body.payBackData.sum);
      var relation = rLoan.relation('loanPayBacks');
      var q = relation.query();
      q.notEqualTo('status',mconfig.loanPayBackStatus.completed.value);
      q.find().then(function(list){
        rLoan.save().then(function(ll){
          for (var i = 0; i < list.length; i++) {
            //最后一期算结清的钱
            if(list[i].order == rLoan.get('payTotalCircle')){
              list[i].set('status',mconfig.loanPayBackStatus.completed.value);
              list[i].set('payBackMoney',req.body.payBackData.sum);  
            }else{
              list[i].set('status',mconfig.loanPayBackStatus.closed.value);
              list[i].set('payBackMoney',0);
            }
            list[i].set('payBackDate',req.body.payBackDate);
            list[i].save();
          };
          mutil.renderSuccess(res);
        },function(error){
          mutil.renderError(res, error);
        })
      });
    }
  });
});

/****************************
  项目放款和收款的统计接口
*/
//统计放款金额
app.get(config.baseUrl + '/loan/statictics/outcome', function (req, res){
  var u = check_login(res);
  var startsWith = (new moment(req.query.startDate)).startOf('day');
  var endsWith = (new moment(req.query.endDate)).endOf('day');
  var loanQuery = new AV.Query('Loan');
  loanQuery.equalTo('owner', u);
  loanQuery.notEqualTo('status', mconfig.loanStatus.draft.value);

  var query = new AV.Query('LoanRecord');
  query.greaterThanOrEqualTo('payDate', startsWith.toDate());
  query.lessThanOrEqualTo('payDate', endsWith.toDate());
  query.equalTo('isPayed', true);
  query.matchesQuery('loan',loanQuery);
  query.include('loan');
  var map = {
      sum : 0,
      startsWith: startsWith.valueOf(),
      endsWith : endsWith.valueOf()
  };
  return classficStatictics(res, query, map, 'outMoney');
});
//统计收到的还款金额
app.get(config.baseUrl + '/loan/statictics/income', function (req, res){
  var u = check_login(res);
  var loanQuery = new AV.Query('Loan');
  loanQuery.equalTo('owner', u);
  //定时时间段
  var startsWith = (new moment(req.query.startDate)).startOf('day');
  var endsWith = (new moment(req.query.endDate)).endOf('day');
  var query = new AV.Query('LoanPayBack');
  //结清的金额需要存在最后一期还款上面  - 而不是直接存json
  query.greaterThanOrEqualTo('payBackDate', startsWith.toDate());
  query.lessThanOrEqualTo('payBackDate', endsWith.toDate());
  query.equalTo('status',mconfig.loanPayBackStatus.completed.value);
  query.matchesQuery('loan',loanQuery);
  query.include('loan');
  var map = {
      sum : 0,
      startsWith: startsWith.valueOf(),
      endsWith : endsWith.valueOf()
  };
  return classficStatictics(res, query, map, 'payBackMoney');
});

function classficStatictics(res, query, baseMap, key){
  query.find().then(function(rs){
    var typeMap = mconfig.getSumMap(mconfig.loanTypes);
    var payBackWayMap = mconfig.getSumMap(mconfig.payBackWays);
    for (var i = 0; i < rs.length; i++) {
      var value = rs[i].get(key);
      baseMap.sum = baseMap.sum + value;
      var typeKey = rs[i].get('loan').get('loanType');
      var payBackWay = rs[i].get('loan').get('payWay');
      typeMap[typeKey].sum += value;
      payBackWayMap[payBackWay].sum += value;
    };
    baseMap['typeStatictics'] = typeMap;
    baseMap['wayStattictics'] = payBackWayMap;
    return mutil.renderData(res, baseMap);
  });
}
/**统计接口
***************/

/*****************************************
 * 联系人相关接口
 */
app.post(config.baseUrl + '/contact', function(req, res){
  var u = check_login(res);
  var contact = mcontact.createContact(req.body, u);
  contact.save().then(function(r_contact){
    if(req.body.attachments){
      mcontact.bindContactFiles(r_contact, req.body.attachments);
    }
    mutil.renderData(res, r_contact);
  },function(error){
    mutil.renderError(res, error);
  })
});

/*更新联系人*/
app.put(config.baseUrl + '/contact/:id', function (req, res){
  var u = check_login(res);
  var contact = AV.Object.createWithoutData('Contact',req.params.id);
  contact.fetch().then(function(rc){
    if(rc.get('certificateNum') == undefined){
      mutil.renderError(res, {code:404, message:'找不到对象!'});
    }else{
      mcontact.updateContact(rc, req.body);
      rc.save().then(function(rnc){
        mutil.renderData(res, rnc);
      }, function(error){
      mutil.renderError(res,error);
      });
    };
  },function(error){
    mutil.renderError(res,error);
  });
});

//删除一个联系人
app.delete(config.baseUrl + '/contact/:id', function (req, res){
  var u = check_login(res);
  var contact = AV.Object.createWithoutData('Contact',req.params.id);
  var loanQuery = new AV.Query('Loan');
  loanQuery.equalTo('loaner', contact);
  var loanAssurerQuery = new AV.Query('Loan');
  loanAssurerQuery.equalTo('assurer', contact);
  //判断是不是在联系人列表中
  loanQuery.count().try(function(loanerCount){
    if(loanerCount > 0){
      return AV.Promise.error({code:500, message:'该联系人还有关联的项目，不能删除!'});
    }else{
      return loanAssurerQuery.count();
    }
  }).try(function(assurerCount){
    console.log(assurerCount);
    if(assurerCount > 0){
      return AV.Promise.error({code:500, message:'该联系人还有关联的项目，不能删除!'});
    }else{
      return AV.Promise.as(true);
    }
  }).catch(function(error) {
    return AV.Promise.as(false);
  }).try(function(rc){
    if(!rc){
      return AV.Promise.error({code:500, message:'该联系人还有关联的项目，不能删除!'});
    }else{
      return AV.Object.destroyAll([contact]);
    }
  }).catch(function(error){
    return mutil.renderErrorData(res, error);
  }).try(function(rc){
    return mutil.renderSuccess(res);
  });
});


app.get(config.baseUrl + '/contact/:id', function (req, res){
  var u = check_login(res);
  var query = new AV.Query('Contact');
  query.equalTo("owner",u);
  query.equalTo("objectId",req.params.id);
  query.find({
    success: function(contacts){
      if(contacts.length == 0){
        mutil.renderError(res, {code:404, message:'contact not found'});
      }else{
        mutil.renderData(res, contacts[0]);
      }
    },
    error: function(error){
      mutil.renderError(res, error);
    }
  });
});

//如果身份证或者驾驶证存在，就返回该用户的联系人
app.get(config.baseUrl + '/contact/certificate/:certificateNum', function (req, res){
  var u = check_login(res);
  var certificateNum = req.params.certificateNum;
  var query = new AV.Query('Contact');
  query.equalTo("certificateNum",certificateNum);
  query.equalTo("owner",u);
  query.find({
    success: function(results){
      if(results.length==0){
        mutil.renderErrorData(res,{code:404, message:'contact not found'});
      }else{
        mutil.renderData(res, results);  
      }
    },
    error: function(error){
      mutil.renderError(res, error);
    }
  });
});

//获取一个用户所有联系人
app.get(config.baseUrl + '/contact/list/all', function (req, res){
  var u = check_login(res);
  var query = new AV.Query('Contact');
  query.descending('updatedAt');
  query.equalTo("owner",u);
  renderContactList(res, query);
});

app.get(config.baseUrl + '/contact/list/search', function (req, res){
  var u = check_login(res);
  var query = new AV.Query('Contact');
  query.equalTo("owner", u);
  if(req.query.type == 'name'){
    query.startsWith("name", req.query.key);
  }else if(req.query.type == 'certificate'){
    query.startsWith("certificateNum", req.query.key);
  }
  renderContactList(res, query);
});

function renderContactList(res, query){
  query.find({
    success: function(results){
      var rclist = [];
      for (var i = 0; i < results.length; i++) {
        rclist.push(transformContact(results[i]));
      };
      mutil.renderData(res, rclist); 
    },
    error: function(error){
      mutil.renderError(res, error);
    }
  });
}

app.get(config.baseUrl + '/contact/list/page/:pn', function (req, res){
  var u = check_login(res);
  var pageNumber = req.params.pn;
  var query = new AV.Query('Contact');
  query.equalTo("owner",u);
  
  var totalPageNum = 1;
  var resultsMap = {};
  query.count().then(function(count){
    totalPageNum = parseInt((count-1)/ mconfig.pageSize) + 1;
    resultsMap['totalPageNum'] = totalPageNum;
    resultsMap['totalNum'] = count;
    resultsMap['pageSize'] = mconfig.pageSize;
  }).then(function(){
    if(pageNumber > resultsMap.totalPageNum){
        resultsMap['values'] = [];
        mutil.renderData(res, resultsMap);
    }else{
      query.skip(pageNumber*mconfig.pageSize - mconfig.pageSize);
      query.limit(mconfig.pageSize);
      query.find({
        success: function(lpbList){
          resultsMap['values'] = lpbList;
          mutil.renderData(res, resultsMap);
        },
        error: function(error){
          mutil.renderError(res, error);
        }
      });
    }
  });
});

//获取联系人附件
app.get(config.baseUrl + '/contact/:id/attachments', function (req,res){
  var u = check_login(res);
  var contact =  AV.Object.createWithoutData('Contact', req.params.id);
  contact.fetch().then(function(rc){
    var relation = rc.relation('attachments');
    relation.query().find().then(function(attachmentList){
      mutil.renderData(res, attachmentList);
    });
  },function(error){
    mutil.renderError(res, error);
  });
});

app.delete(config.baseUrl + '/contact/:id/attachments/:attid', function (req, res){
  handlerContactAttachment(req, res, 'remove');
});

app.post(config.baseUrl + '/contact/:id/attachments/:attid', function (req, res){
  handlerContactAttachment(req, res, 'add');
});

function handlerContactAttachment(req, res, type){
  var u = check_login(res);
  var contact =  AV.Object.createWithoutData('Contact', req.params.id);
  var attachment = AV.Object.createWithoutData('_File', req.params.attid);
  contact.fetch().then(function(r_contact){
    var relation = r_contact.relation('attachments');
    if(type == 'add'){
      relation.add(attachment);  
    }else if(type == 'remove'){
      relation.remove(attachment);
    }
    r_contact.save().then(function(c){
      mutil.renderData(res, c);
    },function(error){
      mutil.renderError(res, error);
    });
  },function(error){
    mutil.renderError(res, error);
  });
};

/*
  查询字典表
 */
app.get(config.baseUrl + '/dict/:key', function (req, res){
  var key = req.params.key
  var dictData = mconfig.convertDictToList(key);
  if(dictData == null){
    mutil.renderError(res, {code:404, message:'dict not found'});
  }
  mutil.renderData(res, mconfig.convertDictToList(key));
});

//上传文件
app.post(config.baseUrl + '/attachment', function (req, res){  
  var fType = req.body.fileType;
  if(!fType){
    fType = null;
  }
  saveFileThen(req, fType, function(attachment){
    if(attachment){
      mutil.renderData(res, {metaData:attachment.metaData(), id:attachment.id, url:attachment.url(),
        name:attachment.name()});
    }else{
      mutil.renderError(res, {code:400, message:'上传失败'});
    };
  });
});

app.post(config.baseUrl + '/loanPawn', function (req,res){
  var u = check_login(res);
  var pawn = mloan.createLoanPawn(req.body);
  pawn.save().then(function(r_pawn){
    if(req.body.attachments){
      mloan.bindPawnAttachments(r_pawn,req.body.attachments);
    }
    mutil.renderData(res, r_pawn);
  },function(error){
    mutil.renderError(res, error);
  });
});

app.get(config.baseUrl + '/loanPawn/:id', function (req,res){
  var u = check_login(res);
  var pawn = AV.Object.createWithoutData('LoanPawn', req.params.id);
  pawn.fetch().then(function(r_pawn){
    mutil.renderData(res, r_pawn);
  },function(error){
    mutil.renderError(res, error);
  });
});


app.get(config.baseUrl + '/loanPawn/:id/attachments', function (req,res){
  var u = check_login(u);
  var pawn = AV.Object.createWithoutData('LoanPawn',req.params.id);
  pawn.fetch().then(function(r_pawn){
    r_pawn.relation('attachments').query().find(function(alist){
      mutil.renderData(res, alist);
    },function(error){
      mutil.renderError(res, error);
    });
  },function(error){
    mutil.renderError(res, error);
  });
});

/*
  User defined fuctions
 */
function calculateOverdueMoney(loan, baseDate, payDate){
  var a = moment(baseDate);
  var b = moment(payDate);
  var offsetDay = b.diff(a, 'days');
  if(offsetDay <= 0){
    return 0;
  }else{
    return loan.get('amount') * offsetDay * loan.get('overdueCostPercent');
  }
};

//项目调整
//流程 结清当前项目 + 生成一个新项目
function concretePayBack(lpb, loan, overdueMoney){
  var result = {};
  result['loaner'] = {
    name: loan.get('loaner').get('name'),
    ObjectId : loan.get('loaner').id,
  };
  result['loanObjectId'] = loan.id;
  result['loanNumberWithName'] = loan.get('numberWithName');
  result['payObjectId'] = lpb.id;
  result['serialNumber'] = loan.get('serialNumber');
  result['payTotalCircle'] = loan.get('payTotalCircle');
  result['payCurrCircle'] = lpb.get('order');
  result['payDate'] = lpb.get('payDate'); //应还日期
  result['amount'] = loan.get('amount');
  result['payMoney'] = lpb.get('payMoney') + overdueMoney;
  result['overdueMoney'] = overdueMoney; //违约金
  result['interestsMoney'] = lpb.get('interestsMoney'); //利息
  //result['payedMoney'] = loan.payedMoney;
  return result;
};


//需要根据最近的还款周期列出项目，这个需要反向生成
function listLoan(res, query, pageNumber){
  var totalPageNum = 1;
  var resultsMap = {};
  query.count().then(function(count){
    totalPageNum = parseInt(count / mconfig.pageSize) + 1;
    resultsMap['totalPageNum'] = totalPageNum;
    resultsMap['totalNum'] = count;
    resultsMap['pageSize'] = mconfig.pageSize;
  }).then(function(){
      if(pageNumber > resultsMap.totalPageNum){
        resultsMap['values'] = [];
        mutil.renderData(res, resultsMap);
      }else{
        query.skip(pageNumber*mconfig.pageSize - mconfig.pageSize);
        query.find({
          success: function(results){
            var rlist = [];
            for (var i = 0; i < results.length; i++) {
              rlist.push(transformLoan(results[i]));
            };
            resultsMap['values'] = rlist;
            mutil.renderData(res, resultsMap);
          },
          error: function(error){
            mutil.renderError(res, error);
          }
        });
      }
  });
};

function transformLoan(l){
  if(l == undefined){
    return {};
  }
  var loaner = l.get('loaner');
  var assurer = l.get('assurer');
  var pawn = l.get('pawn');
  if(!pawn){
    pawn = null;
  }
  if(!loaner){
    loaner = null;
  }
  if(!assurer){
    assurer = null;
  }
  var listStatus;
  if(l.get('status') == mconfig.loanStatus.completed.value){
    payStatus = mconfig.loanListTypes.completed;
  }else{
    var now = new moment();
    var diffMonth = now.diff(moment(l.get('currPayDate')), 'month');
    if(diffMonth <= 0){
      //正常
      payStatus = mconfig.loanListTypes.normal;
    }else if(diffMonth>=1 && diffMonth<=3){
      //逾期
      payStatus = mconfig.loanListTypes.overdue;
    }else if(diffMonth>3){
      //坏账
      payStatus = mconfig.loanListTypes.badbill;
    }
  }
  var result = {
      id: l.id,
      objectId:l.id,
      amount: l.get('amount'),
      createdAt: formatTime(l.createdAt),
      loaner: transformContact(loaner),
      pawn : pawn,
      payedMoney: l.get('payedMoney'),
      assurer: transformContact(assurer),
      loanType: mconfig.getConfigMapByValue('loanTypes', l.get('loanType')),
      payWay: mconfig.getConfigMapByValue('payBackWays', l.get('payWay')),
      status: mconfig.getConfigMapByValue('loanStatus', l.get('status')),
      payStatus: payStatus,
      serialNumber: l.get('serialNumber'),
      numberWithName: l.get('numberWithName'),
      preLoanData : l.get('preLoanData'),
      isModifiedLoan: l.get('isModifiedLoan'),
      version : l.get('version')
  };
  return result;
};

function transformLoanDetails(l){
  var m = transformLoan(l);
  if(m == undefined || l == undefined){
    return {};
  }
  m['spanMonth'] = l.get('spanMonth');
  m['startDate'] = formatTime(l.get('startDate'));
  m['endDate'] = formatTime(l.get('endDate'));
  m['payCircle'] = l.get('payCircle');
  m['payTotalCircle'] = l.get('payTotalCircle');
  m['interests'] = l.get('interests');
  m['assureCost'] = l.get('assureCost');
  m['serviceCost'] = l.get('serviceCost');
  m['overdueCostPercent'] = l.get('overdueCostPercent');
  m['otherCost'] = l.get('otherCost');
  m['keepCost'] = l.get('keepCost');
  m['otherCostDesc'] = l.get('otherCostDesc');
  m['keepCostDesc'] = l.get('keepCostDesc');
  m['firstPayDate'] = formatTime(l.get('firstPayDate'));
  m['finishBill'] = l.get('finishBill');
  m['isSmsRemind'] = l.get('isSmsRemind');
  m['isEmailRemind'] = l.get('isEmailRemind');
  return m;
}

function transformContact(c){
  if(!c){
    return null;
  }
  var mobilePhoneNumber = "";
  if(c.get('mobilePhoneNumber')){
    mobilePhoneNumber = c.get('mobilePhoneNumber');
  }
  return {
    id: c.id,
    objectId: c.id,
    name: c.get('name'),
    email: c.get('email'),
    certificateNum: c.get('certificateNum'),
    address: c.get('address'),
    qq: c.get('qq'),
    wechat: c.get('wechat'),
    certificateType: c.get('certificateType'),
    mobilePhoneNumber: mobilePhoneNumber,
    sendSmsOrNot: c.get('sendSmsOrNot'),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  };
};



function formatTime(t) {
    var date = moment(t).format('YYYY-MM-DD HH:mm:ss');
    return date;
};

//todo: set fileType
function saveFileThen(req, fType, f) {
    if (req.files == null) {
        f();
        return;
    }
    var attachmentFile = req.files.attachment;
    if (attachmentFile && attachmentFile.name !== '') {
        fs.readFile(attachmentFile.path, function (err, data) {
            if (err) {
                return f();
            }
            var theFile = new AV.File(attachmentFile.name, data);
            theFile.metaData('fileType', fType);
            theFile.save().then(function (theFile) {
                f(theFile);
            }, function (err) {
                f();
            });
        });
    } else {
        f();
    }
};

function check_login(res){
  var u = account.isLogin();
  if(u){
    return u;
  }else{
    mutil.renderError(res, {code:501, message:'未登录，请重新登录！'});
  }
};

// 最后，必须有这行代码来使 express 响应 HTTP 请求
app.listen({"static": {maxAge: 604800000}});