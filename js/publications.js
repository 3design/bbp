/**
 * referencesLoadingPrescript
 * fetchReferences
 * populateReferenceList
 * referenceLoadingPostscript
 * 
 * declared in zotero.js
 */

/**
 * IIFE to populate itemtypes & populate initial list
 */
(async () => {
    const ZETORO_COLLECTION = 'XT9EWQJJ'
    const urls = [`https://api.zotero.org/groups/${ZETORO_ID}/collections/${ZETORO_COLLECTION}/items/top`]

    referencesLoadingPrescript()

    fetchedItems = await fetchReferences(urls)
    populateReferenceList(fetchedItems)
    
    const searchInput = document.getElementById("ref-search")
    searchInput.addEventListener('search', onFilterCriteriaChange)
    searchInput.addEventListener("keyup", event => {
        if (event.key === 'Enter') {
            onFilterCriteriaChange()
        }
    })

    referenceLoadingPostscript()
    
    async function onFilterCriteriaChange(){

        referencesLoadingPrescript()

        const direction = "desc"
        const sort = "date"

        const searchString = document.getElementById('ref-search').value

        fetchedItems = await fetchReferences(urls, sort, direction, searchString)
        populateReferenceList(fetchedItems)

        referenceLoadingPostscript()
    }
})()
