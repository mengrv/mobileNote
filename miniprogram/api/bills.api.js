const deleteBill = (billid) => {
  return new Promise((resolve, reject)=>{
    if (!billid) {
      wx.showToast({
        title: 'billid缺失',
        icon: 'none',
      })
      reject();
    }
    const db = wx.cloud.database()
    db.collection('bills').doc(billid).remove({
      success: res => {
        wx.showToast({
          title: '删除成功',
        })
        resolve(billid);
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '删除失败',
        })
        console.error('[数据库] [删除记录] 失败：', err)
        reject();
      }
    })
  })
}

export default {
  deleteBill
}