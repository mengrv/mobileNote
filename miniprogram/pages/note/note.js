// miniprogram/pages/note/note.js
const app = new getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bills: [],
    totalData: {
      income: 0,
      expend: 0,
      total: 0
    }
  },

  onBillTab(e){
    const bill = e.currentTarget.dataset.bill;
    wx.navigateTo({
      url: '../addNote/addNote',
      success: function (res) {
        res.eventChannel.emit('bill', bill)
      }
    })
  },

  getDateString(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const _month = date.getMonth() + 1;
    const month = _month > 9 ? _month : ('0' + _month);
    const _day = date.getDate();
    const day = _day > 9 ? _day : ('0' + _day);
    return `${year}-${month}-${day}`;
  },

  /**
   * 获取的那个月的开始、结束时间
   */
  getMonthDate() {
    const date = new Date();
    const start_date = (date.setDate(1) / 100000).toFixed() * 100000;
    date.setMonth(date.getMonth() + 1);
    const end_date = (date.setDate(1) / 100000).toFixed() * 100000;
    return {
      start_date,
      end_date
    }
  },

  /**
   * 当月数据统计
   * TODO: 当月统计
   */
  onQueryTotal(income = false) {
    const db = wx.cloud.database();
    const $ = db.command.aggregate;
    const {
      start_date,
      end_date
    } = this.getMonthDate();
    db.collection('bills').aggregate()
      .match(
        $.and([{
            income: income
          },
          {
            billDate: {
              $gte: start_date,
              $lt: end_date
            }
          }
        ])
      )
      .group({
        _id: null,
        number: $.sum('$number')
      })
      .end().then(res => {
        console.log(res);
        if (income) {
          this.setData({
            'totalData.income': res.list[0].number
          })
        } else {
          this.setData({
            'totalData.expend': res.list[0].number
          })
        }
      })
  },

  onQueryBills() {
    const {
      start_date,
      end_date
    } = this.getMonthDate();
    const db = wx.cloud.database();
    const _ = db.command;
    // 查询当前用户所有的 counters
    db.collection('bills').where({
      billDate: _.gt(start_date).and(_.lt(end_date))
    }).orderBy('billDate', 'desc').orderBy('createdTime', 'desc').get({
      success: res => {
        const result = res.data || [];
        const bills = [];
        result.forEach(t => {
          let _bills = bills.find(n => n.date === t.billDate);
          if (_bills) {
            if(t.income) {
              _bills.income = _bills.income + t.number
            } else {
              _bills.expend = _bills.expend + t.number
            }
            _bills.list.push(t);
          } else {
            bills.push({
              date: t.billDate,
              dateString: this.getDateString(t.billDate),
              income: t.income ? t.number : 0,
              expend: t.income ? t.number : 0,
              list: [t]
            })
          }
        })
        this.setData({
          bills: bills
        });
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    });
  },

  onGetOpenid: function() {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          openid: res.result.openid,
          appId: res.result.appid
        }
        this.onQueryBills();
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    if (app.globalData.userInfo.openid) {
      this.onQueryBills();
    } else {
      this.onGetOpenid();
    }
    this.onQueryTotal();
    this.onQueryTotal(true)
  },


})