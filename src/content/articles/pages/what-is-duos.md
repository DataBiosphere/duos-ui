**DUOS** helps **researchers access controlled-access datasets** more efficiently by making data access decisions **faster, more consistent, and more transparent**. It is designed to reduce the burden on Data Access Committees (DACs) and improve the user experience for both data stewards and requesters.

## The current state of data access

[![Diagram scheming the current process that researchers follow to request access to a controlled-access dataset.](/article-images/what-is-duos-1.png)](https://support.terra.bio/hc/article_attachments/28485393625627)

Genomic datasets for human subjects often have complex and/or ambiguous restrictions on future use dictated by the original consent forms, which must be respected when utilizing data.

Previously, such data use limitations were uniquely drafted across institutions, creating vast inconsistencies.

On top of this, researchers submitting data access requests define their intended use of the datasets with varying levels of clarity and specificity and are delayed by needing to obtain their Signing Official’s approval prior to submitting their request. Unfortunately, a number of the world’s data access committees (DACs) that receive these requests do not have a standardized approach for collecting this information, which leads to further ambiguity.

The lack of consistent standards on both sides of this equation requires the investment of significant human effort to determine if researchers should be permitted to use data. This ultimately confuses and delays the data access request process, while the amount of genomic data and the number of skilled researchers capable of analyzing it is increasing exponentially.

DUOS is working to improve this process, let us describe how.

We will start on the left of our diagram…

### Reducing the complexity of determining permitted uses of data from consent forms with machine-readable codes

Let’s look at the present issue with consent forms.

Many consent forms either contain unique, institution-specific language on data sharing or remain silent. Unfortunately, these uniquely written or silent consent forms provide DACs with difficult-to-interpret guidance on how data may be permissibly shared.

To solve this issue, [GA4GH’s Data Use and Researcher Identities (DURI) workstream](https://www.ga4gh.org/work_stream/data-use-researcher-identities-duri-2/) created the [Data Use Ontology (DUO)](https://www.sciencedirect.com/science/article/pii/S2666979X21000355). This is a structured, human-readable, and machine-readable vocabulary for defining terms of future data use and is meant to provide a common standard for describing data-sharing policies in consent forms. To facilitate the implementation of GA4GH’s DUO, the DURI workstream and GA4GH’s Regulatory and Ethics workstream [(REWS)](https://www.ga4gh.org/work_stream/regulatory-ethics/) created the Machine Readable Consent Guidance ([PDF](https://drive.google.com/file/d/102_I0_phOGs9YSmPx7It9CSt1sHFJ87C/view)). This guidance instructs IRBs and investigators on how to use DUO terms in consent forms to clearly describe the permitted uses of the data collected using the DUO standard.

The Data Use Ontology is an official GA4GH standard now referenced by genomics repositories in over 15 countries, is actively being adopted in the drafting of numerous consent forms by IRBs and investigators, and is an integral element of the DUOS software.

### Making permitted data use clearer in consent forms through the GA4GH Data Use Ontology

Once the consent forms clearly distinguish the permitted uses of the data using machine-readable DUO terms, the data can be tagged and stored with its appropriate DUO terms. This enables investigators desiring to access the data to know up front whether or not they are likely to be granted access. Furthermore, having clearly defined DUO terms for each dataset significantly facilitates the work of the DAC in determining if requests for the data are consistent with its permitted uses.

### Making intended use clearer in data access requests through the GA4GH Data Use Ontology

Even though clearly defined DUO terms for datasets significantly facilitate the work of the DAC, DACs are still left with multiple issues in receiving and reviewing data access requests.

First, they are responsible for interpreting complex, domain-specific research proposals contained within each request, which they must compare with the requested dataset’s permitted uses.

Additionally, the DAC is responsible for assuring the legitimacy of a submitting researcher and making sure they have appropriate institutional backing.

Further, DACs and Signing Officials often sign and/or negotiate a unique data access agreement between their institutions for every single data access request submitted/approved.

## A two-fold approach to improving data access requests

### Pre-authorizing researchers, and machine-readable access requests

DUOS’ aim is to drive process, policy, and software improvements that reduce or remove each of these issues’ impact on research. We approach this from two angles.

First, to address the complexity of the domain-specific research proposals in each request, DUOS requires investigators requesting access to structure their data access requests using Data Use Ontology’s structured vocabulary.

Second, to make it easier for Signing Officials (SOs) to verify researchers’ legitimacy while reducing their administrative burden, DUOS developed the Broad Data Access Agreement. This is a single-signature, annually renewable data access agreement under which SOs can pre-authorize any investigators from their institution to submit data access requests to any DAC using the DUOS system. This means that SOs only need to approve a researcher once, rather than separately reviewing each data access request submitted by that researcher. As a result, both researchers and SOs can work more efficiently.

Pre-authorizing data access requests is a growing practice among scientific institutions, including the [National Human Genome Research Institute](https://www.genome.gov/AnVIL/Facilitating-Efficient-and-Compliant-Data-Access-Management-Through-the-Data-Use-Oversight-System) (NHGRI) and [Human Cell Atlas](https://www.humancellatlas.org/) (HCA). Other institutions interested in pre-authorizing data access requests are welcome to bring their own Data Access Agreements to DUOS.

### Now DACs can compare permitted uses and access requests with enhanced clarity and efficiency

With those improvements to the data access request process in place, DACs are then able to compare the permitted use of the data and the data access request both described in GA4GH Data Use Ontology terms. This significantly expedites the DAC’s review of a data access request. On top of this, the Signing Official is no longer required to take part in the review and submission of each DAR, nor does a unique data access agreement need to be signed. Removing these elements of the process further expedites the process.

### With both permitted uses and access requests in machine-readable terms, an algorithm can offer suggested decisions to DACs

Having the permitted use of the data and the data access request both described in GA4GH Data Use Ontology terms doesn’t just facilitate the DAC’s review. Given that the DUO terms are machine-readable, it means that we are able to use the DUOS algorithm to compare the permitted uses with the data access request instantly.

Currently, DACs using DUOS are able to review the algorithm’s suggested decision on comparing the permitted uses with the data access request prior to logging their final decision on a request. This allows DUOS to further improve the accuracy of the algorithm.
