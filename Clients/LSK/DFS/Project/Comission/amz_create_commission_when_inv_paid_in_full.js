/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @Author Jahnavi Chandaka
 */
define(['N/record','N/format','N/search'],

    function(record, format, search) {

  /**
   * Marks the beginning of the Map/Reduce process and generates input data.
   *
   * @typedef {Object} ObjectRef
   * @property {number} id - Internal ID of the record instance
   * @property {string} type - Record type id
   *
   * @return {Array|Object|Search|RecordRef} inputSummary
   * @since 2015.1
   */
  function getInputData() {
    try{
      var invoiceSearchObj = search.create({
           type: "transaction",
           filters:
           [
              [[["type","anyof","CustInvc"],
              "AND",
              ["status","anyof","CustInvc:B"],
              "AND",
              ["numbertext","startswith","INVTX"],
              "AND",
              [[["custbody_amz_commission","isnotempty",""],"AND",["custbodyfinal_commission","notequalto","0.00"]],"OR",["custbodycom_adjust","isnotempty",""]]],
              "OR",
              [["type","anyof","CustCred"],"AND",[["custbodyfinal_commission","lessthan","0.00"],"OR",["custbodycom_adjust","isnotempty",""]]]], 
                "AND",
              ["mainline","is","T"], 
              "AND", 
              ["custbody_amz_commission_link","anyof","@NONE@"],
            // "AND",
            // ["internalidnumber","equalto","115036"]
           ],
           columns:
           [
              search.createColumn({name: "subsidiary", label: "Subsidiary"}),
      search.createColumn({name: "type", label: "Type"}),
              search.createColumn({name: "department", label: "Department"}),
              search.createColumn({
                 name: "trandate",
                 sort: search.Sort.ASC,
                 label: "Date"
              }),
              search.createColumn({name: "salesrep", label: "Sales Rep"}),
             search.createColumn({name: "createdfrom", label: "Created From"}),
             search.createColumn({name: "partner", label: "Partner"}),
              search.createColumn({name: "location", label: "Location"}),
              search.createColumn({name: "custbodyfinal_commission", label: "Final Commission"}),
               search.createColumn({name: "custbodycom_adjust", label: "Commission Adjustment"}),
               search.createColumn({
               name: "custentitydfs_type_commission",
               join: "customerMain",
               label: "Type of Commission"
            })
           ]
        });
       //log.debug('mapsearchResult',invoiceSearchObj);
      return invoiceSearchObj;

    }catch(ex){
      log.error(ex.name,ex.message);
    }
  }
  /**
   * Executes when the map entry point is triggered and applies to each key/value pair.
   *
   * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
   * @since 2015.1
   */
  function map(context) { 
    try{
      var mapsearchResult = JSON.parse(context.value);
      log.debug('mapsearchResult',mapsearchResult);

      var invId = mapsearchResult.id;      

     var date = mapsearchResult.values.trandate;
    log.debug('date',date);
      
      var record_type = mapsearchResult.values.type.value;
    log.debug('record_type',record_type);

     var tot = mapsearchResult.values.custbodyfinal_commission;
    log.debug('tot',tot);

    var comm_adj = mapsearchResult.values.custbodycom_adjust;
    log.debug('comm_adj',comm_adj);

    var type_comm = mapsearchResult.values['custentitydfs_type_commission.customerMain'].value;
    log.debug('type_comm',type_comm);
      
         if(type_comm){ 
      var parsedDate = format.parse({value:date, type: format.Type.DATE});
          
      var firstDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth()+1, 1);
          log.debug('firstDay',firstDay);

        var commRec = record.create({
          type: 'customtransaction_amz_commission',
          isDynamic: true                       
        });
        log.debug('commRec',commRec);

        var commRec_type = commRec.type;
        log.debug('commRec_type',commRec_type);

        commRec.setValue({
          fieldId: 'subsidiary',
          value: mapsearchResult.values.subsidiary.value,
          ignoreFieldChange: true
        });
  if(type_comm =='1'){            
              commRec.setValue({
          fieldId: 'custbody_amz_sales_rep',
          value: mapsearchResult.values.salesrep.value,
          ignoreFieldChange: true
        });
  }else if(type_comm =='2'){       
      commRec.setValue({
          fieldId: 'custbody_amz_partner',
          value: mapsearchResult.values.partner.value,
          ignoreFieldChange: true
        });
  }             
              commRec.setValue({
          fieldId: 'location',
          value: mapsearchResult.values.location.value,
          ignoreFieldChange: true
        });

        commRec.setValue({
          fieldId: 'department',
          value: mapsearchResult.values.department.value,
          ignoreFieldChange: true
        });

        commRec.setValue({
          fieldId: 'transtatus',
          value: 'B',
          ignoreFieldChange: true
        });
              
              var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          var postingPeriod = months[parsedDate.getMonth()] + ' ' + parsedDate.getFullYear();
          log.debug('postingPeriod',postingPeriod);

          commRec.setText({
            fieldId: 'postingperiod',
            value: postingPeriod,
            ignoreFieldChange: true
          });
              
              commRec.setValue({
            fieldId: 'trandate',
            value: parsedDate,
            ignoreFieldChange: true
          });
              
              commRec.setValue({
            fieldId: 'custbody_amz_reversal_date',
            value: firstDay,
            ignoreFieldChange: true
          });

        commRec.setValue({
          fieldId: 'custbody_amz_invoice_num',
          value: invId,
          ignoreFieldChange: true
        });


        var lineNum = commRec.selectLine({
          sublistId: 'line',line:0
        });
        commRec.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: 617

        });

        commRec.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'debit',
          value: tot
        });
        commRec.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'entity',
          value:''

        });
        commRec.commitLine({
          sublistId: 'line'
        });

        var lineNum = commRec.selectLine({
          sublistId: 'line',
          line:1
        });
        commRec.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          value: 751

        });

        commRec.setCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'credit',
          value: tot
        });
           
           if(type_comm =='1'){
        commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_amz_sales_rep_partner',
                    value:mapsearchResult.values.salesrep.value
                });
           }else if(type_comm =='2'){
        commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_amz_sales_rep_partner',
                    value:mapsearchResult.values.partner.value
                });
           }
           
        commRec.commitLine({
          sublistId: 'line'
        });

        var link = commRec.save({enableSourcing: true,
          ignoreMandatoryFields: true

        });
         }

        /*var customerpaymentSearchObj = search.create({
           type: "customerpayment",
           filters:
           [
              ["type","anyof","CustPymt"], 
              "AND", 
              ["appliedtotransaction.internalidnumber","equalto",invId]
           ],
           columns:
           [
              search.createColumn({
                 name: "trandate",
                 sort: search.Sort.DESC,
                 label: "Date"
              })
           ]
        }).run().getRange(0,1);
      
      var depositapplicationSearchObj = search.create({
       type: "depositapplication",
       filters:
       [
          ["type","anyof","DepAppl"], 
          "AND", 
          ["appliedtotransaction.internalidnumber","equalto",invId]
       ],
       columns:
       [
          search.createColumn({name: "trandate",
                 sort: search.Sort.DESC, label: "Date"})
       ]
    }).run().getRange(0,1);
      
if(customerpaymentSearchObj.length>0){
        var parsed_Date = format.parse({value:customerpaymentSearchObj[0].getValue('trandate'), type: format.Type.DATE});
}else if(depositapplicationSearchObj.length>0){
        var parsed_Date = format.parse({value:depositapplicationSearchObj[0].getValue('trandate'), type: format.Type.DATE});
}     */
        record.submitFields({ type: record_type == 'CustInvc'?record.Type.INVOICE:record.Type.CREDIT_MEMO,
          id:mapsearchResult.id,
          values: {
            custbody_amz_commission_link : link?link:'',
            //custbody_date_payment : parsed_Date?parsed_Date:''
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields : true
          }
        });
      
    }catch(ex){
      log.error(ex.name,ex);
    }
  }
  /**
   * Executes when the reduce entry point is triggered and applies to each group.
   *
   * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
   * @since 2015.1
   */
  function reduce(context) {

  }


  /**
   * Executes when the summarize entry point is triggered and applies to the result set.
   *
   * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
   * @since 2015.1
   */
  function summarize(summary) {

  }

  return {
    getInputData: getInputData,
    map: map,
    //reduce: reduce,
    summarize: summarize
  };

});
