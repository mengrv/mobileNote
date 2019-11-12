// miniprogram/pages/note/note.js
import BillApi from "../../api/bills.api.js"
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
        },
        slideButtons: [{
            text: '改',
            extClass: 'mr-slide-btn',
            src: '/images/icons/Pencil.svg', // icon的路径
            data: 'detail'
        }, {
            type: 'warn',
            text: '警示',
            extClass: 'mr-slide-btn',
            src: '/images/icons/Delete.svg', // icon的路径
            data: 'delete'
        }],
    },

    slideButtonTap(e) {
        switch (e.detail.data) {
            case 'detail':
                const bill = e.currentTarget.dataset.bill;
                this.onBillTab(bill);
                break
            case 'delete':
                BillApi.deleteBill(e.currentTarget.dataset.bill._id).then(() => this.refreshData());
                break
        }
    },

    onBillTab: function(bill) {
        wx.navigateTo({
            url: '../addNote/addNote',
            success: function(res) {
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
        const _ = db.command;
        const {
            start_date,
            end_date
        } = this.getMonthDate();
        console.log('[查询统计数据]', '[start_date]', start_date, '[end_date]', end_date);
        db.collection('bills').aggregate()
            .match({
                income: income,
                billDate: _.gte(start_date)
            })
            .match({
                billDate: _.lt(end_date)
            })
            .group({
                _id: null,
                number: $.sum('$number')
            })
            .end().then(res => {
                if (!res.list.length) {
                    if (income) {
                        this.setData({
                            'totalData.income': 0
                        })
                    } else {
                        this.setData({
                            'totalData.expend': 0
                        })
                    }
                    return console.log('[查询结果]', res);
                }
                if (income) {
                    this.setData({
                        'totalData.income': res.list[0].number
                    })
                } else {
                    this.setData({
                        'totalData.expend': res.list[0].number
                    })
                }
            }).catch(err => {
                console.error('[查询统计数据错误]', err)
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
                        if (t.income) {
                            _bills.income = _bills.income + Number(t.number)
                        } else {
                            _bills.expend = _bills.expend + Number(t.number)
                        }
                        _bills.list.push(t);
                    } else {
                        bills.push({
                            date: t.billDate,
                            dateString: this.getDateString(t.billDate),
                            income: t.income ? Number(t.number) : 0,
                            expend: t.income ? 0 : Number(t.number),
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

    refreshData() {
        if (app.globalData.userInfo.openid) {
            this.onQueryBills();
        } else {
            this.onGetOpenid();
        }
        this.onQueryTotal();
        this.onQueryTotal(true)
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        this.refreshData();
    },


})