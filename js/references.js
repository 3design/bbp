/**
 * fetchedItems
 * referencesLoadingPrescript
 * fetchReferences
 * populateReferenceList
 * referenceLoadingPostscript
 * ZETORO_ID
 * ZETORO_COLLECTION
 * ZOTERO_COMMUNITY_COLLECTION
 * 
 * declared in zotero.js
 */


const urls = [
    `https://api.zotero.org/groups/${ZETORO_ID}/collections/${ZETORO_COLLECTION}/items/top`,
    `https://api.zotero.org/groups/${ZETORO_ID}/collections/${ZOTERO_COMMUNITY_COLLECTION}/items/top`,
];

/**
 * IIFE to populate itemtypes & populate initial list
 */
(async () => {
    referencesLoadingPrescript()

    fetchedItems = await fetchReferences(urls)
    
    const tally = {}
    for (const item of fetchedItems){
        const { itemType } = item.data
        if (!tally[itemType]) {
            tally[itemType] = 0
        }
        tally[itemType] += 1
    }
    for (const itemtype in tally){
        const detail = {
            total: tally[itemtype],
            itemtype,
        }
        const event = new CustomEvent(ZOTERO_TOTAL_EVENT_NAME, { detail })
        document.dispatchEvent(event)
    }

    populateReferenceList(fetchedItems)
    
    const searchInput = document.getElementById("ref-search")
    searchInput.addEventListener('search', onFilterCriteriaChange)
    searchInput.addEventListener("keyup", event => {
        if (event.key === 'Enter') {
            onFilterCriteriaChange()
        }
    })

    referenceLoadingPostscript()
    
})()

async function onFilterCriteriaChange(){

    referencesLoadingPrescript()

    const direction = "desc"
    const sort = "date"

    const searchString = document.getElementById('ref-search').value

    fetchedItems = await fetchReferences(urls, sort, direction, searchString)
    populateReferenceList(fetchedItems)

    referenceLoadingPostscript()
}
