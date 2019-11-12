// components/noteListItem/noteListItem.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        note: Object
    },

    /**
     * 组件的初始数据
     */
    data: {

    },

    /**
     * 组件的方法列表
     */
    methods: {
        onBillTab() {
            this.triggerEvent('Tab', this.properties.note);
        }
    }
})