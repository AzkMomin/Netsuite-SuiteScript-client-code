/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record', "N/format"
], function (search, record, format) {
    // var partnerIDs = getPartners()
    const getInputData = () => {

        // Get the partners whose has guarantee  pay and dont have commission in currentr record
        const data = getData()

        return data
    }

    const map = (context) => {
        var RecResult = JSON.parse(context.value);
        log.debug('------------------------------ : ');
        log.debug('searchResult : ', RecResult);

        const commRec = createCommRecord(RecResult);
    }

    const createCommRecord = (person) => {
        try {
            var commRec;
            var PreviousPartnerRecord = getPreviousPartnerRecord(person.internalID);
            log.debug('PreviousPartnerRecord : ', PreviousPartnerRecord)
            if (PreviousPartnerRecord.isFound) {
                log.debug("Previous rec found with ID : ", PreviousPartnerRecord.internalID)
                commRec = record.load({
                    type: 'customrecord921',
                    id: person.internalID,
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



            var date = new Date("10/31/2022");
            var month = date.getMonth() + 1;
            //Setting partner or emp field
            commRec.setValue({ fieldId: 'custrecord_amz_dfs_com_partner', value: person.internalID });
            //setting month date means script will run on month date i.e todays date
            commRec.setValue({
                fieldId: "custrecord_amz_dfs_com_date",
                value: format.parse({
                    value: date,
                    type: format.Type.DATE
                })
            });
            //settin current month
            commRec.setValue({ fieldId: "custrecord_lsk_comm_month", value: month });

            //Setting Monthly commission
            commRec.setValue({ fieldId: "custrecord_amz_dfs_com_month_comm", value: 0 });

            var PartnerAccumulatedComm = getPartnerAccumulatedComm(person.internalID);
            var accumulatedComm = 0;
            if (PartnerAccumulatedComm.isFound) {
                accumulatedComm += Number(PartnerAccumulatedComm.accuComm);
            }
            log.debug('accumulatedComm : ', accumulatedComm)

            //Setting accumulated commission field
            commRec.setValue({ fieldId: "custrecord_amz_dfs_com_acc_comm", value: accumulatedComm });

            var fieldLookUp = search.lookupFields({
                type: 'partner',
                id: person.internalID,
                columns: ['custentity_dfs_guarantee_pay']
            });

            var anualGuarenteeComm = Number(fieldLookUp.custentity_dfs_guarantee_pay);
            log.debug('anualGuarenteeComm : ', anualGuarenteeComm)

            if (fieldLookUp.custentity_dfs_guarantee_pay != "") {
                var monthlyPayables = Number(anualGuarenteeComm) / 12;
                //Setting annual guarentee field
                commRec.setValue({ fieldId: "custrecord_amz_dfs_com_grantee", value: anualGuarenteeComm });

                // commRec.setValue({ fieldId: "custrecord_lsk_monthlyguaranteedcomm", value: monthlyGuarenteeComm });
                // Setting Monthly Payables
                commRec.setValue({ fieldId: "custrecord_amz_monthly_commission", value: monthlyPayables });
                log.debug('monthlyGuarenteeComm : ', monthlyPayables)
            }else{
                commRec.setValue({ fieldId: "custrecord_amz_dfs_com_grantee", value: 0 });
                commRec.setValue({ fieldId: "custrecord_amz_monthly_commission", value: 0 });
            }

            var commRecSavedID = commRec.save();
            log.debug("Commission record created/updated successfrully for", commRecSavedID)
            log.debug("-----------------------------------------------")

        }
        catch (e) {
            log.debug("error", e)
        }
    }

    const getPartnerAccumulatedComm = (partnerId) => {
        var obj;
        const customrecord_commissionsSearchColEmployee = search.createColumn({ name: 'custrecord_amz_dfs_com_emp', summary: search.Summary.GROUP });
        const customrecord_commissionsSearchColPartner = search.createColumn({ name: 'custrecord_amz_dfs_com_partner', summary: search.Summary.GROUP });
        const customrecord_commissionsSearchColAccumulatedCommission = search.createColumn({ name: 'custrecord_amz_dfs_com_acc_comm', summary: search.Summary.SUM });
        const customrecord_commissionsSearch = search.create({
            type: 'customrecord921',
            filters: [
                // ['custrecord_amz_dfs_com_date', 'within', 'lastmonth'],
                // ['custrecord_lsk_comm_month', 'anyof', '1'],
                ['custrecord_amz_dfs_com_date', 'within','9/1/2022', '9/30/2022'],
                'AND',
                ['custrecord_amz_dfs_com_partner', 'anyof', String(partnerId)],
                'AND',
                // ['custrecord_amz_dfs_com_date', 'within', 'thisfiscalyear'],
                // ['custrecord_amz_dfs_com_date', 'within', '11/1/2022', '11/30/2023'],
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
    const getPreviousPartnerRecord = (partnerId) => {
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
                ['custrecord_amz_dfs_com_emp', 'anyof', String(partnerId)],
            ],
            columns: [
                customrecord921SearchColScriptId,
                customrecord921SearchColInternalId,
            ],
        });
        // Note: Search.run() is limited to 4,000 results
        // customrecord_commissionsSearch.run().each((result: search.Result): boolean => {
        //   return true;
        // });
        const customrecord_commissionsSearchPagedData = customrecord921Search.runPaged({ pageSize: 1000 });
        if (customrecord_commissionsSearchPagedData.pageRanges.length != 0) {
            for (let i = 0; i < customrecord_commissionsSearchPagedData.pageRanges.length; i++) {
                const customrecord_commissionsSearchPage = customrecord_commissionsSearchPagedData.fetch({ index: i });
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

        return found;
    }


    const getData = () => {

        //partners who has annual guarantee pay
        var partnersIDs = getPartners()
        // Partners ID whose commission record has created of current month
        var PartnersIDOfCommRec = getPartnersIDOfCommRec();

        for (var i in partnersIDs) {
            PartnersIDOfCommRec.forEach((result) => {
                if (PartnersIDOfCommRec.indexOf(partnersIDs[i].internalID) != -1) {
                    partnersIDs.splice(i, 1)
                }
            })
        }
        // log.debug('partnersIDs : ', partnersIDs)
        // log.debug('PartnersIDOfCommRec : ', PartnersIDOfCommRec)
        return partnersIDs
    }
    const getPartners = () => {
        var partnerIds = []
        var mySearch = search.load({
            id: 3042
        });
        mySearch.run().each(function (result) {
            var internalID = result.getValue({
                name: 'internalid'
            });
            var guaranteePay = result.getValue({
                name: 'custentity_dfs_guarantee_pay'
            });
            partnerIds.push({
                internalID: internalID,
                guaranteePay: guaranteePay
            })
            return true;
        });
        return partnerIds
    }


    const getPartnersIDOfCommRec = () => {
        var commRecPartnerId = []
        var mySearch = search.load({
            id: 3043
        });
        mySearch.run().each(function (result) {
            var partnerId = result.getValue({
                name: 'internalid', join: 'CUSTRECORD_AMZ_DFS_COM_PARTNER'
            });
            commRecPartnerId.push(partnerId)
            return true;
        });
        return commRecPartnerId
    }
    return {
        getInputData,
        map,
        // reduce
    }

});