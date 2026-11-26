# OPA Rego Policy — STO Critical Finding Gate
# Applied at: Account scope → Pipeline Policies
# Trigger: On Pipeline Stage (SecurityTests stage completion)
#
# This policy fails the pipeline if any UNEXEMPTED Critical severity
# finding is present in the STO scan results.

package pipeline

# Default to deny
default allow = false

# Allow only when no unexempted critical findings exist
allow {
  count(critical_findings) == 0
}

# Collect all critical, unexempted findings across all scanners
critical_findings[finding] {
  stage := input.pipeline.stages[_]
  stage.type == "SecurityTests"
  finding := stage.sto.findings[_]
  finding.severity == "Critical"
  finding.exempted == false
}

# Deny rule with descriptive message
deny[msg] {
  count(critical_findings) > 0
  findings_list := [f.cve | f := critical_findings[_]]
  msg := sprintf(
    "Pipeline blocked: %d unexempted Critical finding(s) found. CVEs: %v. Remediate or add an exemption with expiry before promoting.",
    [count(critical_findings), findings_list]
  )
}

# Warn on High findings (non-blocking)
warn[msg] {
  stage := input.pipeline.stages[_]
  stage.type == "SecurityTests"
  finding := stage.sto.findings[_]
  finding.severity == "High"
  finding.exempted == false
  msg := sprintf("High severity finding detected: %v — review before production.", [finding.cve])
}
