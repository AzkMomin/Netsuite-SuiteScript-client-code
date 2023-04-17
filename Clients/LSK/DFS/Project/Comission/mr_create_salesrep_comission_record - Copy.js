/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
  'N/search', 'N/record', "N/format"
], function (search, record, format) {

  const getInputData = () => {
    var transactionSearch = search.load({
      id: 3040
    })

    return transactionSearch
  }

  const map = (context) => {
    var inv_RecResult = JSON.parse(context.value);
    // log.debug('searchResult : ', inv_RecResult);
    const salesrep = inv_RecResult.values.salesrep.value;

    context.write({
      key: salesrep,
      value: {
        invId: inv_RecResult.id,
        // JE_ID: commJE_RecResult.values["GROUP(internalid)"].value,
        creditAmt: inv_RecResult.values["custbodyfinal_commission"],
        // commTypeSplit: commJE_RecResult.values["GROUP(custbody_split_commissions.CUSTBODY_AMZ_INVOICE_NUM)"],
      }
    });
  }
  const reduce = (context) => {
    var salesrepId = context.key
    var records = context.values

    var commAmount = 0;
    var linkApplyToCommJE = []
    var linkApplyToInv = []

    // log.debug("salesrepId ", salesrepId)
    // log.debug("records ", records)
    records.forEach((result) => {
      var resultObj = JSON.parse(result);
      commAmount += Number(resultObj.creditAmt)
      // linkApplyToCommJE.push(resultObj.JE_ID);
      linkApplyToInv.push({
        invId: resultObj.invId,
        // isSplitComm: resultObj.commTypeSplit,
      });

    })

    commAmount = commAmount.toFixed(2)
    // log.debug('commAmount : ', commAmount)
    // log.debug('linkApplyToCommJE : ', linkApplyToCommJE)

    var salesrepAccumulatedComm = getSalesrepAccumulatedComm(salesrepId);
    var prevSalesRepRec = getPreviousSalesRepRecord(salesrepId)
    // log.debug('salesrepAccumulatedComm : ', salesrepAccumulatedComm)

    const person = {
      id: salesrepId,
      monthComm: commAmount,
      // commJE_ID: linkApplyToCommJE,
      invIds: linkApplyToInv,
      accuCommObj: salesrepAccumulatedComm,
      prevRec: prevSalesRepRec,
    }
    log.debug("person ", person)
    const commRec = createCommRecord(person);

  }
  const createCommRecord = (person) => {
    try {
      var commRec;
      if (person.prevRec.isFound) {
        log.debug("Previous rec found with ID : ", person.prevRec.prevCommRecId)
        commRec = record.load({
          type: 'customrecord921',
          id: person.prevRec.prevCommRecId,
          isDynamic: true
        });
      }
      else {
        log.debug("Previous rec not found: ")
        commRec = record.create({
          type: 'customrecord921',
          isDynamic: true
        });
      }

      var partner_salesrep = "custrecord_amz_dfs_com_emp";

      var todysDate = new Date("10/31/2022");
      var month = todysDate.getMonth() + 1;

      //Setting partner or emp field
      commRec.setValue({ fieldId: partner_salesrep, value: person.id });
      //setting month date means script will run on month date i.e todays date
      commRec.setValue({
        fieldId: "custrecord_amz_dfs_com_date",
        value: format.parse({
          value: todysDate,
          type: format.Type.DATE
        })
      });
      //settin current month
      commRec.setValue({ fieldId: "custrecord_lsk_comm_month", value: month });
      log.debug('month : ', month)
      var accumulatedComm = Number(person.monthComm);
      if (person.accuCommObj.isFound) {
        accumulatedComm += Number(person.accuCommObj.accuComm);
      }
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_acc_comm", value: accumulatedComm });


      //Setting Monthly commission
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_month_comm", value: person.monthComm });
      var fieldLookUp = search.lookupFields({
        type: 'employee',
        id: person.id,
        columns: ['custentity_dfs_guarantee_pay']
      });


      var anualGuarenteeComm = Number(fieldLookUp.custentity_dfs_guarantee_pay);

      //Setting annual guarentee field
      if (fieldLookUp.custentity_dfs_guarantee_pay != "") {
        var monthlyGuarenteeComm = Number(anualGuarenteeComm) / 12;
        let monthlyPayables = monthlyGuarenteeComm
        commRec.setValue({ fieldId: "custrecord_amz_dfs_com_grantee", value: anualGuarenteeComm });

        if (accumulatedComm > anualGuarenteeComm) {
          monthlyPayables += person.monthComm
        }
        // commRec.setValue({ fieldId: "custrecord_lsk_monthlyguaranteedcomm", value: monthlyGuarenteeComm });
        // Setting Monthly Payables
        commRec.setValue({ fieldId: "custrecord_amz_monthly_commission", value: monthlyPayables });

      } else {
        commRec.setValue({ fieldId: "custrecord_amz_dfs_com_grantee", value: 0 });
        commRec.setValue({ fieldId: "custrecord_amz_monthly_commission", value: 0 });
      }

      var commRecSavedID = commRec.save();
      log.debug("Commission record created/updated successfrully for", commRecSavedID)


      // person.commJE_ID.forEach((result) => {
      //   var CommJE_Rec = record.load({
      //     type: "customtransaction_amz_commission",
      //     id: result,
      //   })

      //   var lineNumber = CommJE_Rec.findSublistLineWithValue({
      //     sublistId: 'line',
      //     fieldId: 'custcol_amz_sales_rep_partner',
      //     value: person.id
      //   });

      //   CommJE_Rec.setSublistValue("line", "custcol_lsk_comm_record_jelink", lineNumber, commRecSavedID);
      //   var commJEID = CommJE_Rec.save();
      //   log.debug("Link updated on commission JE id  : ", commJEID)
      // })

      // person.invIds.forEach((result) => {
      //   var otherId = record.submitFields({
      //     type: 'invoice',
      //     id: Number(result.invId),
      //     values: {
      //       'custbody_lsk_commrecord_link': commRecSavedID
      //     }
      //   });
      //   log.debug("Link updated on Invoice id  : ", otherId)

      // })

    }
    catch (e) {
      log.debug("error", e)
    }
  }

  const getSalesrepAccumulatedComm = (salesrepId) => {
    var obj;
    const customrecord_commissionsSearchColEmployee = search.createColumn({ name: 'custrecord_amz_dfs_com_emp', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColPartner = search.createColumn({ name: 'custrecord_amz_dfs_com_partner', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColAccumulatedCommission = search.createColumn({ name: 'custrecord_amz_dfs_com_acc_comm', summary: search.Summary.SUM });
    const customrecord_commissionsSearch = search.create({
      type: 'customrecord921',
      filters: [
        // ['custrecord_amz_dfs_com_date', 'within', 'lastmonth'],
        // ['custrecord_lsk_comm_month', 'anyof', '1'],
        ['custrecord_amz_dfs_com_date', 'within', '9/1/2022', '9/30/2022'],
        'AND',
        ['custrecord_amz_dfs_com_emp', 'anyof', String(salesrepId)],
        'AND',
        // ['custrecord_amz_dfs_com_date', 'within', 'thisfiscalyear'],
        ['custrecord_amz_dfs_com_date', 'within', '11/1/2021', '10/31/2022'],
      ],
      columns: [
        customrecord_commissionsSearchColEmployee,
        customrecord_commissionsSearchColPartner,
        customrecord_commissionsSearchColAccumulatedCommission,
      ],
    });

    const customrecord_commissionsSearchPagedData = customrecord_commissionsSearch.runPaged({ pageSize: 1000 });
    if (customrecord_commissionsSearchPagedData.pageRanges.length != 0) {
      for (let i = 0; i < customrecord_commissionsSearchPagedData.pageRanges.length; i++) {
        const customrecord_commissionsSearchPage = customrecord_commissionsSearchPagedData.fetch({ index: i });
        customrecord_commissionsSearchPage.data.forEach((result) => {
          const employee = result.getValue(customrecord_commissionsSearchColEmployee);
          const partner = result.getValue(customrecord_commissionsSearchColPartner);
          const accumulatedCommission = result.getValue(customrecord_commissionsSearchColAccumulatedCommission);

          obj = {
            isFound: true,
            accuComm: accumulatedCommission
          }
        });
      }
    }
    else {
      obj = {
        isFound: false,
      }
    }

    return obj;
  }

  const getPreviousSalesRepRecord = (salesrepId) => {
    var found;
    const customrecord921SearchColScriptId = search.createColumn({ name: 'scriptid', sort: search.Sort.ASC });
    const customrecord921SearchColInternalId = search.createColumn({ name: 'internalid' });
    const customrecord921Search = search.create({
      type: 'customrecord921',
      filters: [
        // ['custrecord_amz_dfs_com_date', 'within', 'thismonth'],
        // ['custrecord_lsk_comm_month', 'anyof', '2'],

        ['custrecord_amz_dfs_com_date', 'within', '10/1/2022', '10/31/2022'],
        'AND',
        ['custrecord_amz_dfs_com_emp', 'anyof', String(salesrepId)],
      ],
      columns: [
        customrecord921SearchColScriptId,
        customrecord921SearchColInternalId,
      ],
    });

    const customrecord921SearchPagedData = customrecord921Search.runPaged({ pageSize: 1000 });
    if (customrecord921SearchPagedData.pageRanges.length != 0) {
      for (let i = 0; i < customrecord921SearchPagedData.pageRanges.length; i++) {
        const customrecord_commissionsSearchPage = customrecord921SearchPagedData.fetch({ index: i });
        customrecord_commissionsSearchPage.data.forEach((result) => {
          const id = result.getValue(customrecord921SearchColInternalId);
          const scriptId = result.getValue(customrecord921SearchColScriptId);

          found = {
            isFound: true,
            prevCommRecId: id
          }
        });
      }
    } else {
      found = {
        isFound: false,
      }
    }

    return found
  }

  return {
    getInputData,
    map,
    reduce
  }

});