// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IntegrityLedger {
    struct Report {
        string docHash;
        uint256 originalityScore;
        string plagiarismRisk;
        string aiRisk;
        string collusionRisk;
        uint256 timestamp;
        address submitter;
    }

    mapping(string => Report) private reports;

    event ReportStored(string indexed docHash, uint256 timestamp, address submitter);

    function storeReport(
        string memory _docHash,
        uint256 _originalityScore,
        string memory _plagiarismRisk,
        string memory _aiRisk,
        string memory _collusionRisk
    ) public {
        require(reports[_docHash].timestamp == 0, "Report already exists for this document hash");

        reports[_docHash] = Report({
            docHash: _docHash,
            originalityScore: _originalityScore,
            plagiarismRisk: _plagiarismRisk,
            aiRisk: _aiRisk,
            collusionRisk: _collusionRisk,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        emit ReportStored(_docHash, block.timestamp, msg.sender);
    }

    function verifyDocument(string memory _docHash) public view returns (bool) {
        return reports[_docHash].timestamp != 0;
    }

    function getReport(string memory _docHash) public view returns (
        string memory docHash,
        uint256 originalityScore,
        string memory plagiarismRisk,
        string memory aiRisk,
        string memory collusionRisk,
        uint256 timestamp,
        address submitter
    ) {
        require(reports[_docHash].timestamp != 0, "Report not found");
        Report memory r = reports[_docHash];
        return (
            r.docHash,
            r.originalityScore,
            r.plagiarismRisk,
            r.aiRisk,
            r.collusionRisk,
            r.timestamp,
            r.submitter
        );
    }
}
