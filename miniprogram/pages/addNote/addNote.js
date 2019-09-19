// miniprogram/pages/addNote/addNote.js

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    typeList: [],
    selectedType: null,
    error: '',
    billid: null,

    formData: {
      remarks: '',
      number: null,
      billDate: '',
      income: false
    },

    rules: [{
        name: 'number',
        rules: [{
          required: true,
          message: '请输入金额'
        }]
      },
      {
        name: 'billDate',
        rules: [{
          required: true,
          message: '请选择日期'
        }]
      },
      {
        name: 'income',
        rules: null
      },
      {
        name: 'remarks',
        rules: null
      }
    ]
  },

  addOne(data, back) {
    const db = wx.cloud.database();
    db.collection('bills').add({
      data: data,
      success: res => {
        wx.showToast({
          title: '新增记录成功',
        })
        if (back) {
          wx.navigateBack();
        } else {
          this.setData({
            formData: {
              remarks: '',
              number: null,
              billDate: '',
              income: false
            }
          })
        }
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '新增记录失败'
        })
      }
    })
  },

  addNextOne() {
    this.submitForm(false);
  },

  updateBill() {
    const db = wx.cloud.database()
    const newCount = this.data.count + 1
    db.collection('bills').doc(this.data.billid).update({
      data: {
        ...this.data.formData,
        billDate: Date.parse(this.data.formData.billDate),
        number: Number(this.data.formData.number)
      },
      success: res => {
        wx.showToast({
          title: '编辑记录成功',
        })
        wx.navigateBack()
      },
      fail: err => {
        icon: 'none',
          console.error('[数据库] [更新记录] 失败：', err)
      }
    })
  },

  submitForm(back = true) {
    this.selectComponent('#form').validate((valid, errors) => {
      if (!valid) {
        const firstError = Object.keys(errors)
        if (firstError.length) {
          this.setData({
            error: errors[firstError[0]].message
          })
        }
      } else if (this.data.billid) {
        this.updateBill();
      } else {
        this.addOne({
          ...this.data.formData,
          billDate: Date.parse(this.data.formData.billDate),
          number: Number(this.data.formData.number),
          createdTime: new Date(),
          typeName: this.data.selectedType.name,
          icon: this.data.selectedType.icon
        }, back);
      }
    })
  },

  formInputChange(e) {
    const {
      field
    } = e.currentTarget.dataset;
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  initDate: function(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    let year = date.getFullYear();
    let month = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1));
    let day = date.getDate() > 9 ? date.getDate() : (date.getDate() + 1);
    this.setData({
      ['formData.billDate']: `${year}-${month}-${day}`
    });
  },

  bindDateChange: function(e) {
    this.setData({
      ['formData.billDate']: e.detail.value
    });
  },

  /**
   * 查询账单类型列表
   */
  onQuery: function() {
    const db = wx.cloud.database()
    // 查询当前用户所有的 counters
    db.collection('billTypes').where({
      created: 'system'
    }).get({
      success: res => {
        this.setData({
          typeList: res.data
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

  incomeChanged: function(event) {
    this.setData({
      'formData.income': event.detail.value
    });
  },

  chooseBill: function(event) {
    this.initDate();
    this.setData({
      selectedType: event.currentTarget.dataset.bill_type,
      'formData.income': event.currentTarget.dataset.bill_type.income
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.onQuery();
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('bill', (data) => {
      this.setData({
        billid: data._id,
        formData: {
          remarks: data.remarks,
          number: data.number,
          income: data.income
        }
      })
      wx.nextTick(() => {
        this.initDate(data.billDate);
      })
    })
  }
})