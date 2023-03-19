/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
  'N/search', 'N/record', "N/format"
], function (search, record, format) {

  const getInputData = () => {

    var invoiceSearch = search.load({
      id: 'customsearch2974'
    })
    return invoiceSearch
  }

  const map = (context) => {
    var invRecResult = JSON.parse(context.value);
    // log.debug('searchResult : ', invRecResult);
    log.debug('-------------------------------------- : ');
    var invRec = record.load({
      type: invRecResult.recordType,
      id: invRecResult.id
    });

    var tot = parseFloat(invRec.getValue('custbodyfinal_commission'))
    log.debug("tot : ", tot)

    // var customerId = invRec.getValue('entity');

    // var custFields = search.lookupFields({
    //     type: "customer",
    //     id: customerId,
    //     columns: ['custentitydfs_type_commission']
    // });

    var type_comm = invRec.getValue('custbodyinvoice_typecom')
    // log.debug("type_comm : ", type_comm);

    //search for the Commission JE record of that inv
    var commissionJERec = getCommissionJERec(invRecResult.id)
    log.debug("commissionJERec : ", commissionJERec);


    if (commissionJERec.isFound) {
      var commRec = record.load({
        type: 'customtransaction_amz_commission',
        id: commissionJERec.Id,
        // isDynamic: true
      });
    } else {
      var commRec = record.create({
        type: 'customtransaction_amz_commission',
        // isDynamic: true
      });
    }
    // log.debug('commRec', commRec);

    // var commRec_type = commRec.type;
    // log.debug('commRec_type', commRec_type);

    commRec.setValue({
      fieldId: 'subsidiary',
      value: invRec.getValue('subsidiary'),
      ignoreFieldChange: true
    });
    commRec.setValue({
      fieldId: 'location',
      value: invRec.getValue('location'),
      ignoreFieldChange: true
    });

    commRec.setValue({
      fieldId: 'department',
      value: invRec.getValue('department'),
      ignoreFieldChange: true
    });

    commRec.setValue({
      fieldId: 'transtatus',
      value: 'B',
      ignoreFieldChange: true
    });

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var parsedDate = format.parse({ value: invRec.getValue('trandate'), type: format.Type.DATE });

    var postingPeriod = months[parsedDate.getMonth()] + ' ' + parsedDate.getFullYear();
    log.debug('postingPeriod', postingPeriod);

    var firstDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 1);
    // log.debug('firstDay', firstDay);

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
      value: invRecResult.id,
      ignoreFieldChange: true
    });
    commRec.setValue({
      fieldId: 'custbody_lsk_type_of_comm',
      value: type_comm,
      ignoreFieldChange: true
    });


    if (type_comm == '1') {
      var salesrepID = invRec.getValue('salesrep');
      var salesRepFields = search.lookupFields({
        type: "employee",
        id: salesrepID,
        columns: ['custentity_amz_sales_profit_1']
      });

      setCommJeDebitLine(commRec, tot,invRecResult.recordType)

      commRec.setSublistValue({
        sublistId: 'line',
        fieldId: 'account',
        line: 1,
        value: 751

      });
      if(invRecResult.recordType == 'invoice'){
        commRec.setSublistValue({
          sublistId: 'line',
          fieldId: 'debit',
          line: 1,
          value: tot
        });
      }else{
          commRec.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 1,
            value: tot
          });
      }

      commRec.setSublistValue({
        sublistId: 'line',
        fieldId: 'custcoldfs_tx_sales_rate_je',
        line: 1,
        value: parseFloat((salesRepFields.custentity_amz_sales_profit_1).toString().split('.'))
      });

      
      commRec.setSublistValue({
        sublistId: 'line',
        fieldId: 'custcol_amz_sales_rep_partner',
        line: 1,
        value: invRec.getValue('salesrep')
      });
     
    } else if (type_comm == '2') {
      var partnerID = invRec.getValue('partner');
      var partnerFields = search.lookupFields({
        type: "partner",
        id: partnerID,
        columns: ['custentity_amz_sales_profit_1']
      });

      setCommJeDebitLine(commRec, tot,invRecResult.recordType)

      commRec.setSublistValue({
        sublistId: 'line',
        fieldId: 'account',
        line: 1,
        value: 751

      });

      if(invRecResult.recordType = 'invoice'){
        commRec.setSublistValue({
          sublistId: 'line',
          fieldId: 'debit',
          line: 1,
          value: tot
        });
      }else{
          commRec.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 1,
            value: tot
          });
      }


      commRec.setSublistValue({
        sublistId: 'line',
        fieldId: 'custcoldfs_tx_sales_rate_je',
        line: 1,
        value: parseFloat((partnerFields.custentity_amz_sales_profit_1).toString().split('.'))
      });

     
      commRec.setSublistValue({
        sublistId: 'line',
        fieldId: 'custcol_lsk_partner_je_line',
        line: 1,
        value: invRec.getValue('partner')
      });

     
    } else {
      var split_Persons = [];
      var totalforSplit = 0

      var salesRep1 = invRec.getValue('custbodydfs_salesrep1_');
      var salesRep1_rate = invRec.getValue('custbody37');
      var salesRep1_comm = invRec.getValue('custbodydfs_commission1_');

      var salesRep2 = invRec.getValue('custbodydfs_salesrepb_');
      var salesRep2_rate = invRec.getValue('custbodydfs_rateb_');
      var salesRep2_comm = invRec.getValue('custbodydfs_commissionb_');

      var partner1 = invRec.getValue('custbodydfs_partnera_');
      var partner1_rate = invRec.getValue('custbodydfs_partnerarate_');
      var partner1_comm = invRec.getValue('custbodydfs_paacommission_');

      var partner2 = invRec.getValue('custbodydfs_partnerb_');
      var partner2_rate = invRec.getValue('custbodydfs_partnerbrate_');
      var partner2_comm = invRec.getValue('custbodydfs_partnerbcom_');
      if (salesRep1 != "") {
        split_Persons.push({
          personId: parseInt(salesRep1),
          comm_amt: parseFloat(salesRep1_comm),
          comm_type: 1,
          rate: salesRep1_rate,
          isAdjAmt: false
        })
        totalforSplit += parseFloat(salesRep1_comm);

      }
      if (salesRep2 != "") {
        split_Persons.push({
          personId: parseInt(salesRep2),
          comm_amt: parseFloat(salesRep2_comm),
          comm_type: 1,
          rate: salesRep2_rate,
          isAdjAmt: false
        })
        totalforSplit += parseFloat(salesRep2_comm);

      }
      if (partner1 != "") {
        split_Persons.push({
          personId: parseInt(partner1),
          comm_amt: parseFloat(partner1_comm),
          comm_type: 2,
          rate: partner1_rate,
          isAdjAmt: false
        })
        totalforSplit += parseFloat(partner1_comm);
      }
      if (partner2 != "") {
        split_Persons.push({
          personId: parseInt(partner2),
          comm_amt: parseFloat(partner2_comm),
          comm_type: 2,
          rate: partner2_rate,
          isAdjAmt: false
        })
        totalforSplit += parseFloat(partner2_comm);
      }

      // Amount to be adjust when credit and debit is not balance
      var adjAmt = tot - totalforSplit
      if (tot > totalforSplit || tot < totalforSplit) {
        if (adjAmt < 0) {
          adjAmt = adjAmt * 1;
        }
        split_Persons.push({
          personId: parseInt(salesRep1),
          comm_amt: parseFloat(tot - totalforSplit),
          comm_type: 1,
          rate: 0
        })
      }
      log.debug("Persons to set split  : ", split_Persons);
      log.debug("totalforSplit : ", totalforSplit);
      log.debug("adjAmt : ", adjAmt);

      setCommJeDebitLine(commRec, tot)

      for (var i = 0; i < split_Persons.length; i++) {
        // commRec.selectNewLine({
        //     sublistId: 'line',
        // });
        // commRec.setCurrentSublistValue({
        commRec.setSublistValue({
          sublistId: 'line',
          fieldId: 'account',
          line: i + 1,
          value: 751

        });

        // commRec.setCurrentSublistValue({
        commRec.setSublistValue({
          sublistId: 'line',
          fieldId: 'credit',
          line: i + 1,
          value: split_Persons[i].comm_amt
        });


        // commRec.setCurrentSublistValue({
        commRec.setSublistValue({
          sublistId: 'line',
          fieldId: 'custcoldfs_tx_sales_rate_je',
          line: i + 1,
          value: split_Persons[i].rate
        });

        if (split_Persons[i].comm_type == 1) {

          // commRec.setCurrentSublistValue({
          commRec.setSublistValue({
            sublistId: 'line',
            fieldId: 'custcol_amz_sales_rep_partner',
            line: i + 1,
            value: split_Persons[i].personId
          });
        } else {

          // commRec.setCurrentSublistValue({
          commRec.setSublistValue({
            sublistId: 'line',
            fieldId: 'custcol_lsk_partner_je_line',
            line: i + 1,
            value: split_Persons[i].personId
          });
        }
        // commRec.commitLine({
        //     sublistId: 'line'
        // });
      }

    }
    var commissionRecSaveId = commRec.save({
      enableSourcing: true,
      ignoreMandatoryFields: true
    });

    log.debug("commissionRecSaveId : ", commissionRecSaveId);
    var otherId = record.submitFields({
      type: 'invoice',
      id: invRecResult.id,
      values: {
        'custbody_amz_commission_link': commissionRecSaveId
      }
    });
    log.debug("commisssion link save invoice id : ", otherId);

  }

  function getCommissionJERec(invId) {
    var obj
    const transactionSearchColInternalId = search.createColumn({ name: 'internalid' });
    const transactionSearchColFormulaTextXW8AGD0O = search.createColumn({ name: 'formulatext', formula: '{custbody_amz_invoice_num.internalid}' });
    const transactionSearch = search.create({
      type: 'transaction',
      filters: [
        ['type', 'anyof', 'Custom100'],
        'AND',
        ['custbody_amz_invoice_num', 'anyof', invId],
      ],
      columns: [
        transactionSearchColInternalId,
        transactionSearchColFormulaTextXW8AGD0O,
      ],
    });

    var transactionSearchPagedData = transactionSearch.runPaged({ pageSize: 1000 });
    if (transactionSearchPagedData.pageRanges.length != 0) {
      for (var i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
        var transactionSearchPage = transactionSearchPagedData.fetch({ index: i });
        transactionSearchPage.data.forEach(function (result) {
          var internalId = result.getValue(transactionSearchColInternalId);
          var invoiceNumber = result.getValue(transactionSearchColFormulaTextXW8AGD0O);;
          obj = {
            isFound: true,
            Id: internalId
          }
        });
      }
    } else {
      obj = {
        isFound: false,
      }
    }
    return obj;
  }

  function setCommJeDebitLine(commRec, tot,recordType) {
    // commRec.selectLine({
    //     sublistId: 'line', line: 0
    // });
    // commRec.setCurrentSublistValue({
    commRec.setSublistValue({
      sublistId: 'line',
      fieldId: 'account',
      line: 0,
      value: 617

    });
    if(recordType == 'invoice'){

      // commRec.setCurrentSublistValue({
      commRec.setSublistValue({
        sublistId: 'line',
        fieldId: 'credit',
        line: 0,
        value: tot
      });
    }else{
      commRec.setSublistValue({
        sublistId: 'line',
        fieldId: 'debit',
        line: 0,
        value: tot
      });
    }
    // commRec.setCurrentSublistValue({
    commRec.setSublistValue({
      sublistId: 'line',
      fieldId: 'entity',
      line: 0,
      value: ''

    });
    // commRec.commitLine({
    //     sublistId: 'line'
    // });
  }

  return {
    getInputData,
    map
  }

});