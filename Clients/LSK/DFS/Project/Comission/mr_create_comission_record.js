/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
  'N/search', 'N/record', "N/format"
], function (search, record, format) {

  const getInputData = () => {
    const transactionSearchColInternalId = search.createColumn({ name: 'internalid', summary: search.Summary.GROUP });
    const transactionSearchColAmountCredit = search.createColumn({ name: 'creditamount', summary: search.Summary.MAX });
    const transactionSearchColSalesRep = search.createColumn({ name: 'custcol_amz_sales_rep_partner', summary: search.Summary.GROUP });
    const transactionSearchColPartner = search.createColumn({ name: 'custcol_lsk_partner_je_line', summary: search.Summary.GROUP });
    const transactionSearchColCustbodyAmzInvoiceNumInternalid = search.createColumn({ name: 'internalid', join: 'CUSTBODY_AMZ_INVOICE_NUM', summary: search.Summary.MAX });
    const transactionSearchColTypeOfCommission = search.createColumn({ name: 'custbody_lsk_type_of_comm', summary: search.Summary.MAX });
    const transactionSearch = search.create({
      type: 'transaction',
      filters: [
        ['type', 'anyof', 'Custom100'],
        'AND',
        ['trandate', 'within', 'lastmonth'],
        'AND',
        ['internalid', 'anyof', '172061'],
        'AND',
        ['creditamount', 'isnotempty', ''],
      ],
      columns: [
        transactionSearchColInternalId,
        transactionSearchColAmountCredit,
        transactionSearchColSalesRep,
        transactionSearchColPartner,
        transactionSearchColCustbodyAmzInvoiceNumInternalid,
        transactionSearchColTypeOfCommission,
      ],
    });
    return transactionSearch
  }

  const map = (context) => {
    var commJE_RecResult = JSON.parse(context.value);
    // log.debug('searchResult : ', commJE_RecResult);
    const salesrep = commJE_RecResult.values["GROUP(custcol_amz_sales_rep_partner)"].value;
    const partner = commJE_RecResult.values["GROUP(custcol_lsk_partner_je_line)"].value;

    if (partner != undefined) {
      log.debug("partner : ", partner)
      var partnerAccumulatedComm = getPartnerAccumulatedComm(partner);
      var prevPartnerRec = getPreviousPartnerRecord(partner)
      //Created object for creating commission record
      const person = {
        person: "partner",
        commType: commJE_RecResult.values["MAX(custbody_lsk_type_of_comm)"],
        id: commJE_RecResult.values["GROUP(custcol_lsk_partner_je_line)"].value,
        monthComm: parseFloat(commJE_RecResult.values["MAX(creditamount)"]),
        commJE_ID: commJE_RecResult.values["GROUP(internalid)"].value,
        invId: commJE_RecResult.values["MAX(internalid.CUSTBODY_AMZ_INVOICE_NUM)"],
        accuCommObj: partnerAccumulatedComm,
        prevRec: prevPartnerRec

      }
      log.debug(":person : ", person);
      const commRec = createCommRecord(person);
    }
    else {

      var salesrepAccumulatedComm = getSalesrepAccumulatedComm(salesrep);
      var prevSalesRepRec = getPreviousSalesRepRecord(salesrep)
      //Created object for creating commission record
      const person = {
        person: "employee",
        commType: commJE_RecResult.values["MAX(custbody_lsk_type_of_comm)"],
        id: commJE_RecResult.values["GROUP(custcol_amz_sales_rep_partner)"].value,
        monthComm: parseFloat(commJE_RecResult.values["MAX(creditamount)"]),
        commJE_ID: commJE_RecResult.values["GROUP(internalid)"].value,
        invId: commJE_RecResult.values["MAX(internalid.CUSTBODY_AMZ_INVOICE_NUM)"],
        accuCommObj: salesrepAccumulatedComm,
        prevRec: prevSalesRepRec

      }
      log.debug(":person : ", person);
      const commRec = createCommRecord(person);

    }
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

      var partner_salesrep;
      if (person.person == "partner") {
        partner_salesrep = "custrecord_amz_dfs_com_partner";
      } else {
        partner_salesrep = "custrecord_amz_dfs_com_emp";
      }

      // log.debug("partner or commission : ", partner_salesrep);

      var todysDate = new Date();
      var month = todysDate.getMonth() + 1;
      // log.debug("Current Month Number : ", month);
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

      //Setting Monthly commission
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_month_comm", value: person.monthComm });
      var fieldLookUp = search.lookupFields({
        type: person.person,
        id: person.id,
        columns: ['custentity_dfs_guarantee_pay']
      });

      var anualGuarenteeComm = parseFloat(fieldLookUp.custentity_dfs_guarantee_pay);

      // log.debug("anual gaurentee commission : ", anualGuarenteeComm);

      var accumulatedComm = parseFloat(person.monthComm);
      if (person.accuCommObj.isFound) {
        accumulatedComm += parseFloat(person.accuCommObj.accuComm);
      }


      // log.debug("accumulated commission : ", accumulatedComm);

      //Setting accumulated commission field
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_acc_comm", value: accumulatedComm });

      //Setting annual guarentee field
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_grantee", value: anualGuarenteeComm });

      var monthlyGuarenteeComm = parseFloat(anualGuarenteeComm) / 12;

      let monthlyPayables = monthlyGuarenteeComm
      if (accumulatedComm > anualGuarenteeComm) {
        monthlyPayables += person.monthComm
      }
      // Setting Monthly guarentee commission
      // log.debug("monthly Guarentee commission : ", monthlyGuarenteeComm);
      commRec.setValue({ fieldId: "custrecord_lsk_monthlyguaranteedcomm", value: monthlyGuarenteeComm });


      // Setting Monthly Payables
      // log.debug("monthlyPayables commission : ", monthlyPayables);
      commRec.setValue({ fieldId: "custrecord_amz_monthly_commission", value: monthlyPayables });

      var commRecSavedID = commRec.save();
      log.debug("Commission record created/updated successfrully for", commRecSavedID, person.person)

      var invFields = search.lookupFields({
        type: "invoice",
        id: person.invId,
        columns: ['custbodydfs_salesrep1_', "custbodydfs_salesrepb_", 'custbodydfs_partnera_', 'custbodydfs_partnerb_'] //"custentity31", "custentity32", "custentity33"
      });

      // log.debug("invFields : " , invFields)
      var CommJE_Rec = record.load({
        type: "customtransaction_amz_commission",
        id: person.commJE_ID,
        isDynamic: true
      })
      var commJE_lineCount = CommJE_Rec.getLineCount({ sublistId: "line" });
      if (person.person == "partner") {
        for (var i = 0; i < commJE_lineCount; i++) {
          CommJE_Rec.selectLine("line", i);
          var partner = CommJE_Rec.getCurrentSublistValue("line", "custcol_lsk_partner_je_line");
          if (partner == person.id) {
            CommJE_Rec.setCurrentSublistValue("line", "custcol_lsk_comm_record_jelink", commRecSavedID);
            CommJE_Rec.commitLine("line");

          }
        }

      } else {
        for (var i = 0; i < commJE_lineCount; i++) {
          CommJE_Rec.selectLine("line", i);
          var salesrep = CommJE_Rec.getCurrentSublistValue("line", "custcol_amz_sales_rep_partner");
          if (salesrep == person.id) {
            CommJE_Rec.setCurrentSublistValue("line", "custcol_lsk_comm_record_jelink", commRecSavedID);
            CommJE_Rec.commitLine("line");
          }
        }

      }
      if (person.commType == "Split Commission") {
        if (person.person == "partner") {
          if (invFields.custbodydfs_partnera_ != "" && invFields.custbodydfs_partnera_[0].value == person.id) {
            // log.debug(" Partner A : ", invFields.custbodydfs_partnera_);
            var otherId = record.submitFields({
              type: 'invoice',
              id: person.invId,
              values: {
                'custbody_lsk_partnerlink_1': commRecSavedID
              }
            });
          }
          else if (invFields.custbodydfs_partnerb_ != "" && invFields.custbodydfs_partnerb_[0].value == person.id) {
            // log.debug(" Partner B : ", invFields.custbodydfs_partnerb_);
            var otherId = record.submitFields({
              type: 'invoice',
              id: person.invId,
              values: {
                "custbody_lsk_partnerlink_2": commRecSavedID
              }
            });

          }
        } else {

          if (invFields.custbodydfs_salesrep1_ != "" && invFields.custbodydfs_salesrep1_[0].value == person.id) {
            // log.debug(" SalesRep A : ", invFields.custbodydfs_salesrep1_)
            var otherId = record.submitFields({
              type: 'invoice',
              id: person.invId,
              values: {
                "custbody_lsk_commlink_1": commRecSavedID
              }
            });
          }
          else if (invFields.custbodydfs_salesrepb_ != "" && invFields.custbodydfs_salesrepb_[0].value == person.id) {
            // log.debug(" SalesRep  : ", invFields.custbodydfs_salesrepb_)
            var otherId = record.submitFields({
              type: 'invoice',
              id: person.invId,
              values: {
                "custbody_lsk_salesreplink_2": commRecSavedID
              }
            });

          }
        }
      } else {
        var otherId = record.submitFields({
          type: 'invoice',
          id: person.invId,
          values: {
            "custbody_lsk_commrecord_link": commRecSavedID
          }
        });
      }
      var commJEID = CommJE_Rec.save();
      log.debug("Link updated on commission JE id  : ", commJEID)

    }
    catch (e) {
      log.debug("error", e)
    }
  }

  // function setLinks(invId, fieldId, commId) {
  // var otherId = record.submitFields({
  //   type: 'invoice',
  //   id: invId,
  //   values: {
  //     fieldId: commId
  //   }
  // });

  // var invRec = record.load({
  //   type : 'invoice',
  //   id:invId
  // })

  // invRec.setValue({fieldId : fieldId , value : commId})
  // invRec.save();

  // }
  const getPartnerAccumulatedComm = (partnerId) => {
    var obj;
    const customrecord_commissionsSearchColEmployee = search.createColumn({ name: 'custrecord_amz_dfs_com_emp', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColPartner = search.createColumn({ name: 'custrecord_amz_dfs_com_partner', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColAccumulatedCommission = search.createColumn({ name: 'custrecord_amz_dfs_com_acc_comm', summary: search.Summary.SUM });
    const customrecord_commissionsSearch = search.create({
      type: 'customrecord921',
      filters: [
        ['custrecord_amz_dfs_com_date', 'within', 'lastmonth'],
        'AND',
        ['custrecord_amz_dfs_com_partner', 'anyof', partnerId],
        'AND',
        ['custrecord_amz_dfs_com_date', 'within', 'thisfiscalyear'],
      ],
      columns: [
        customrecord_commissionsSearchColEmployee,
        customrecord_commissionsSearchColPartner,
        customrecord_commissionsSearchColAccumulatedCommission,
      ],
    });

    const customrecord_commissionsSearchPagedData = customrecord_commissionsSearch.runPaged({ pageSize: 1000 });
    if (customrecord_commissionsSearchPagedData.pageRanges.length !== 0) {
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

  const getSalesrepAccumulatedComm = (salesrepId) => {
    var obj;
    const customrecord_commissionsSearchColEmployee = search.createColumn({ name: 'custrecord_amz_dfs_com_emp', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColPartner = search.createColumn({ name: 'custrecord_amz_dfs_com_partner', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColAccumulatedCommission = search.createColumn({ name: 'custrecord_amz_dfs_com_acc_comm', summary: search.Summary.SUM });
    const customrecord_commissionsSearch = search.create({
      type: 'customrecord921',
      filters: [
        ['custrecord_amz_dfs_com_date', 'within', 'lastmonth'],
        'AND',
        ['custrecord_amz_dfs_com_emp', 'anyof', salesrepId],
        'AND',
        ['custrecord_amz_dfs_com_date', 'within', 'thisfiscalyear'],
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
  const getPreviousPartnerRecord = (partnerId) => {
    var found;
    const customrecord_commissionsSearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
    const customrecord_commissionsSearchColScriptId = search.createColumn({ name: 'scriptid' });
    const customrecord_commissionsSearch = search.create({
      type: 'customrecord921',
      filters: [
        ['custrecord_amz_dfs_com_date', 'within', 'thismonth'],
        'AND',
        ['custrecord_amz_dfs_com_partner', 'anyof', partnerId],
      ],
      columns: [
        customrecord_commissionsSearchColId,
        customrecord_commissionsSearchColScriptId,
      ],
    });
    // Note: Search.run() is limited to 4,000 results
    // customrecord_commissionsSearch.run().each((result: search.Result): boolean => {
    //   return true;
    // });
    const customrecord_commissionsSearchPagedData = customrecord_commissionsSearch.runPaged({ pageSize: 1000 });
    if (customrecord_commissionsSearchPagedData.pageRanges.length != 0) {
      for (let i = 0; i < customrecord_commissionsSearchPagedData.pageRanges.length; i++) {
        const customrecord_commissionsSearchPage = customrecord_commissionsSearchPagedData.fetch({ index: i });
        customrecord_commissionsSearchPage.data.forEach((result) => {
          const id = result.getValue(customrecord_commissionsSearchColId);
          const scriptId = result.getValue(customrecord_commissionsSearchColScriptId);

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

    return found;
  }
  const getPreviousSalesRepRecord = (salesrepId) => {
    var found;
    const customrecord921SearchColScriptId = search.createColumn({ name: 'scriptid', sort: search.Sort.ASC });
    const customrecord921SearchColInternalId = search.createColumn({ name: 'internalid' });
    const customrecord921Search = search.create({
      type: 'customrecord921',
      filters: [
        ['custrecord_amz_dfs_com_date', 'within', 'thismonth'],
        'AND',
        ['custrecord_amz_dfs_com_emp', 'anyof', salesrepId],
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
    map
  }

});