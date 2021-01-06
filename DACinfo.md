## DUOS for DACs

### DACs must answer important questions about access to data, but often have to interpret complex and ambiguous inputs to those decisions

Currently, when DAC’s receive data access requests they must decide if the proposed research use is within the bounds of the data’s use limitations.

[![](http://img.youtube.com/vi/8ZyU34xpi4M/0.jpg)](http://www.youtube.com/watch?v=8ZyU34xpi4M "")

<img src="https://github.com/duos-ui/duos_process_flow.png">


Unfortunately, data use limitations are often described with unique language across the various consent forms in which they appear (diagram left). Thus a DAC is left to attempt to interpret either the consent form, or the receive the original IRB’s interpretation (ex. NIH Institutional Certification, Broad Data Use Letter) to determine the official use limitations.

On the other hand (diagram right), researchers data access requests are often narrative scientific proposals of varying levels of depth and specificity as to the research proposed.

The inconsistency and lack of clarity in the terms used to describe data use use limitations and research proposals makes it difficult for DACs to answer the question of “Is the proposed research within the bounds of the data use limitations?”



To resolve this issue, the Global Alliance for Genomics and Health created a common vocabulary for data use limitations and proposed research, called the Data Use Ontology. The ontology is not only a standardized series of terms and definitions describing data use but is also computer readable.

DUOS leverages the Data Use Ontology by enabling Data Depositors to describe their data use limitations with DUO terms, and Researchers to describe their research purposes with DUO terms. The result is that DACs using DUOS can compare data use limitations and research purposes using the same vocabulary of terms.



Additionally, with the use limitations and proposed research in DUO terms, DUOS can enable an algorithm to compute the comparison of the data use limitations and proposed research in an attempt to replicate the decision the DAC would make. Through testing, the DUOS algorithm has seen >90% agreement with DACs. Currently, DACs are able to leverage the algorithm as a decision-support tool, reviewing the DUOS algorithm’s suggested decision prior to logging their own decision. If the DUOS algorithm proves to consistently decide as the DAC would, DACs may choose to use the DUOS algorithm to automatically respond to data access requests.



## DAC FAQs

### Can my DAC use DUOS?
Yes! If you and/or your DAC is interested in using DUOS, please reach out to use at duos-support@broadinstitute.zendesk.com.

### If my DAC wants to use DUOS, does my data have to be in a specific system?
Nope! Any dataset may be registered in DUOS, regardless of the physical location of the data. Data Custodians and DACs interested in using DUOS are responsible for making sure researchers approved for access via DUOS are able to access the data once approved.

### How do I determine the data use limitations for my dataset(s)?
DUOS is actively developing a tool to enable you to determine your datasets’ data use limitations according to the GA4GH Data Use Ontology, which we aim to make publicly available in 2020. For further assistance, our experienced and expert team is glad to consult with anyone needing guidance in assigning data use limitations to their datasets.

### Does DUOS store genetic data?
No. DUOS only enables the metadata you see displayed in the DUOS Dataset Catalog to be stored in DUOS. All genetic data which may be requested via DUOS is stored in external systems, and predominantly in Broad’s Terra service, though use of Terra is not required for DACs to register their data in DUOS.

### If I make my data available via DUOS, does it need to be located in a single location?
No. However, the Data Custodian for your dataset(s) will be responsible for providing access to researchers approved by the DAC and having data in multiple locations will be increasingly complex for Data Custodians to set and maintain access permissions, and for researchers to access and analyze the data in aggregate.

### Can DUOS allow for multiple parties to review and approve a data access request?
Yes. There are two ways to enable multiple individuals to review a DAR in DUOS.

One option is to add multiple individuals to your DAC, as DAC Members. DAC Members are able to offer comments and a suggested vote to the DAC Chair, without directly controlling the final vote on the DAR. This option is most helpful for individuals who are in the same organization, consortium, or collaborate with one another.

Another option is to set a Data Owner for a dataset. In the case of a DAR approval by the DAC, a notification goes to a Data Owner for them to review the DAR and either approve or deny the DAR themselves. This option is most helpful for separate organizations to clearly delineate each group’s responsibilities and authority.

### Does DUOS automate data access requests?
No, DUOS does not automate data access requests. DUOS’ matching algorithm would easily allow for data access request review to be automated and instantaneous, and we are testing the algorithm with multiple DACs to see if and how this may be possible. Currently, DACs use the DUOS matching algorithm for decision support in their DAR reviews. As community confidence in the matching algorithm grows, we will allow each DAC to control if and when they automate their DARs via DUOS.
