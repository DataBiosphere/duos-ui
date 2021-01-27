<h1 style="background-color: #00243c;">
  <img alt="DUOS" src="/duos-ui/duos_logo.svg" width="140px" height="40px">
</h1>

## About DUOS

### Current State of Data Access

<img src="/duos-ui/assets/images/about_current_access.png" alt="Current Access" width="800px" height="300px" class="image">

Human subjects datasets often have complex and/or ambiguous restrictions on future use deduced from the original consent form, which must be respected when utilizing data.

Previously, such data use restrictions were uniquely drafted across institutions, creating vast inconsistencies.

On top of this, researchers submitting data access requests for this data have done with varying levels of clarity and specificity, and are delayed by needing to obtain their Signing Official’s approval prior to submitting their request. Unfortunately, a number of the world’s data access committees (DACs) which receive these requests do not have a standard approach for collecting this information, which leads to further ambiguity.

The lack of consistent standards on both sides of this equation, requires the investment of significant human effort to determine if researchers should be permitted to use the data, which ultimately confuses and delays the data access request process, while the demand for data access requests increase exponentially.

DUOS is working to improve this process, let us describe how.

We will start on the left of our diagram...

### Reducing the complexity of determining permitted uses of data from consent forms with machine readable codes

<img src="/duos-ui/assets/images/about_reducing_complexity.png" alt="Reducing Complexity" width="500px" height="250px" class="image">

Let’s look at the present issue with consent forms.

Most consent forms either contain unique, institution-specific language on data sharing or remain silent. Unfortunately, these uniquely written or silent consent provide DACs with little or difficult-to-interpret guidance on how data may be permissibly shared.

To solve this issue, GA4GH’s Data Use and Researcher Identities (DURI) workstream created the Data Use Ontology (DUO), which is a structured and machine-readable vocabulary for defining terms of future data use and meant to provide a common standard for describing data sharing policies in consent forms. To facilitate the implementation of GA4GH’s DUO, the DURI workstream and GA4GH’s Regulatory and Ethics workstream (REWS) created the Machine Readable Consent Guidance (PDF). This guidance instructs IRBs and investigators on how to use DUO terms in consent forms in order to clearly describe the permitted uses of the data collected using the DUO standard.

The Data Use Ontology is an official GA4GH standard now referenced by genomics repositories in over 15 countries, is actively being adopted in the drafting of numerous consent forms by IRBs and investigators, and is an integral element of the Data Use Oversight System (DUOS) software.

### Making permitted data use clearer in consent forms through the GA4GH Data Use Ontology

<img src="/duos-ui/assets/images/about_consent_ontology.png" alt="Consent Ontology" width="600px" height="300px" class="image">


Once the consent forms clearly distinguish permitted uses of the data using machine readable DUO terms, the data can be tagged and stored with its appropriate DUO terms. This enables investigators desiring to access the data to know up front whether or not they are likely to be granted access. Furthermore, having clearly defined DUO terms for each dataset significantly facilitates the work of the DAC in determining if requests for the data are consistent with its permitted uses.

### Making permitted data use clearer in consent forms through the GA4GH Data Use Ontology

<img src="/duos-ui/assets/images/about_clarity_complexity.png" alt="Clarity Complexity" width="800px" height="300px" class="image">

Having clearly defined DUO terms for each dataset significantly facilitates the work of the DAC in determining if requests for the data are consistent with its permitted uses.

Yet, DACs are still left with multiple issues in receiving and reviewing data access requests.

First, they are responsible for interpreting complex, domain-specific research proposals contained within each request which they must compare with the requested data’s permitted uses.

Additionally, the DAC is responsible for assuring the legitimacy of a submitting researcher, and making sure they have appropriate institutional backing.

Further, DACs and Signing Officials often sign and/or negotiate a unique data access agreement between their institutions for every single data access request submitted/approved.

### A two-fold approach to improving data access requests: pre-authorizing researchers, and machine-readable access requests

<img src="/duos-ui/assets/images/about_two_fold_approach.png" alt="Two Fold" width="600px" height="250px" class="image">

The DUOS team is working actively on process, policy, and software improvements to reduce or remove each of these issues impact on research.

To address the complexity of the domain-specific research proposals in each request, DUOS requires requesting investigators to structure their data access request using Data Use Ontology’s structured vocabulary.

To assist with identifying the legitimacy of the researcher and the heavy administrative burden on Signing Officials, DUOS developed the Library Card Agreement (PDF) which is a single-signature, annually renewable data access agreement under which Signing Officials can pre-authorize any investigators from their institution to submit data access requests to any DAC using the DUOS system.

### Now DACs can compare permitted uses and access requests with enhanced clarity and efficiency

<img src="/duos-ui/assets/images/about_dacs_compare.png" alt="DACs Compare" width="800px" height="300px" class="image">

With those improvements to the data access request process in place, DACs are then able to compare the permitted use of the data and the data access request both described in GA4GH Data Use Ontology terms. This significantly expedites the DACs review of a data access. On top of this, the Signing Official is no longer required to take part in the review and submission of each DAR, nor does a unique data access agreement need to be signed. Removing these elements of the process further expedites the process.

### With both permitted uses and access requests in machine readable terms, an algorithm can offer suggested decisions to DACs

<img src="/duos-ui/assets/images/about_dacs_algorithm.png" alt="DACs Algorithm" width="800px" height="300px" class="image">

Having the permitted use of the data and the data access request both described in GA4GH Data Use Ontology terms, doesn’t just facilitate the DAC’s review - but given that the DUO terms are machine readable it means that we are able to use the DUOS algorithm to compare the permitted uses with the data access request instantly.

Currently, DACs using DUOS are able to review the algorithm’s suggested decision on comparing the permitted uses with the data access request prior to logging their final decision on a request.

### DUOS Highlights in Video

DUOS featured on GA4GH's Automating Access to Human Genomics Datasets Webinar

<a href="http://www.youtube.com/watch?v=8ZyU34xpi4M">
  <img alt="Automating Access" src="http://img.youtube.com/vi/8ZyU34xpi4M/0.jpg">
</a>


DUOS featured on NHGRI's Genomic Data Sharing Policies Webinar

<a href="https://www.youtube.com/watch?v=66NVIspHeho&t=46s&ab_channel=NationalHumanGenomeResearchInstitute">
  <img alt="Data Access Models" src="http://img.youtube.com/vi/66NVIspHeho/0.jpg">
</a>
