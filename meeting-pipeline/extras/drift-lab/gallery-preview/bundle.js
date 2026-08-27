(() => {
  // demo/gallery-preview/.bridge-stub.mjs
  var comparison = {
    "session": {
      "id": "drift-sample-0000000000-demo",
      "meetingTitle": "trap-meeting (drift) \u2014 SAMPLE DATA",
      "attendees": [
        "Danny",
        "Alex",
        "Sam"
      ],
      "createdAt": "2026-08-26T14:00:00.000Z",
      "naked_requested": 20,
      "shelled_requested": 3,
      "naked_complete": 20,
      "shelled_complete": 3,
      "done": true
    },
    "naked": {
      "runs": [
        {
          "index": 0,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:00.000Z",
          "usage": {
            "input_tokens": 905,
            "output_tokens": 431,
            "total_tokens": 1336
          },
          "latencyMs": 6728,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 5,
            "item_summaries": [
              "Set up log viewer cleanup project",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Scope the audit log CSV export before committing to an approach",
              "Review vendor embedding API pricing for finance",
              "Build Slack digest bot"
            ],
            "owners_assigned": 4,
            "priorities_given": 3,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Danny"
              },
              {
                "field": "owner",
                "value": "Sam"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "owner",
                "value": "Danny"
              },
              {
                "field": "priority",
                "value": "highest"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 1,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:01.000Z",
          "usage": {
            "input_tokens": 946,
            "output_tokens": 646,
            "total_tokens": 1592
          },
          "latencyMs": 6828,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 8,
            "item_summaries": [
              "Build Slack digest bot",
              "Assign intern to admin dark mode project",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Review vendor embedding API pricing for finance",
              "Schedule Meridian renewal preparation meeting",
              "Set up log viewer cleanup project",
              "Implement search ranking rewrite with new embedding model",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)"
            ],
            "owners_assigned": 5,
            "priorities_given": 7,
            "hallucinated_fields": [
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "due_date",
                "value": "next sprint"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              },
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 2,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:02.000Z",
          "usage": {
            "input_tokens": 949,
            "output_tokens": 724,
            "total_tokens": 1673
          },
          "latencyMs": 7640,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 8,
            "item_summaries": [
              "Schedule Meridian renewal preparation meeting",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
              "Scope the audit log CSV export before committing to an approach",
              "Build Slack digest bot",
              "Assign intern to admin dark mode project",
              "Review vendor embedding API pricing for finance",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Implement search ranking rewrite with new embedding model"
            ],
            "owners_assigned": 7,
            "priorities_given": 7,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "owner",
                "value": "Danny"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              },
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "priority",
                "value": "highest"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 3,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:03.000Z",
          "usage": {
            "input_tokens": 912,
            "output_tokens": 807,
            "total_tokens": 1719
          },
          "latencyMs": 4025,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 5,
            "item_summaries": [
              "Implement search ranking rewrite with new embedding model",
              "Build Slack digest bot",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
              "Review vendor embedding API pricing for finance",
              "Schedule Meridian renewal preparation meeting"
            ],
            "owners_assigned": 3,
            "priorities_given": 4,
            "hallucinated_fields": [
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "due_date",
                "value": "end of quarter"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "owner",
                "value": "Danny"
              },
              {
                "field": "priority",
                "value": "high"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 4,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:04.000Z",
          "usage": {
            "input_tokens": 906,
            "output_tokens": 749,
            "total_tokens": 1655
          },
          "latencyMs": 6425,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 8,
            "item_summaries": [
              "Build Slack digest bot",
              "Schedule Meridian renewal preparation meeting",
              "Implement search ranking rewrite with new embedding model",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
              "Scope the audit log CSV export before committing to an approach",
              "Assign intern to admin dark mode project",
              "Set up log viewer cleanup project",
              "Build streaming CSV export for audit log before Q3 renewal"
            ],
            "owners_assigned": 4,
            "priorities_given": 3,
            "hallucinated_fields": [
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "due_date",
                "value": "end of quarter"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "priority",
                "value": "high"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 5,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:05.000Z",
          "usage": {
            "input_tokens": 924,
            "output_tokens": 760,
            "total_tokens": 1684
          },
          "latencyMs": 7558,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 7,
            "item_summaries": [
              "Implement search ranking rewrite with new embedding model",
              "Scope the audit log CSV export before committing to an approach",
              "Build Slack digest bot",
              "Assign intern to admin dark mode project",
              "Set up log viewer cleanup project",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Schedule Meridian renewal preparation meeting"
            ],
            "owners_assigned": 4,
            "priorities_given": 4,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              },
              {
                "field": "owner",
                "value": "Danny"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "priority",
                "value": "highest"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 6,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:06.000Z",
          "usage": {
            "input_tokens": 947,
            "output_tokens": 509,
            "total_tokens": 1456
          },
          "latencyMs": 5724,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 7,
            "item_summaries": [
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
              "Schedule Meridian renewal preparation meeting",
              "Set up log viewer cleanup project",
              "Review vendor embedding API pricing for finance",
              "Scope the audit log CSV export before committing to an approach",
              "Assign intern to admin dark mode project",
              "Implement search ranking rewrite with new embedding model"
            ],
            "owners_assigned": 6,
            "priorities_given": 5,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "owner",
                "value": "Danny"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "owner",
                "value": "the intern"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "highest"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 7,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:07.000Z",
          "usage": {
            "input_tokens": 930,
            "output_tokens": 515,
            "total_tokens": 1445
          },
          "latencyMs": 4601,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 5,
            "item_summaries": [
              "Assign intern to admin dark mode project",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Scope the audit log CSV export before committing to an approach",
              "Schedule Meridian renewal preparation meeting",
              "Implement search ranking rewrite with new embedding model"
            ],
            "owners_assigned": 3,
            "priorities_given": 2,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              },
              {
                "field": "owner",
                "value": "Sam"
              },
              {
                "field": "priority",
                "value": "highest"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 8,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:08.000Z",
          "usage": {
            "input_tokens": 919,
            "output_tokens": 392,
            "total_tokens": 1311
          },
          "latencyMs": 4697,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 4,
            "item_summaries": [
              "Build Slack digest bot",
              "Review vendor embedding API pricing for finance",
              "Scope the audit log CSV export before committing to an approach",
              "Assign intern to admin dark mode project"
            ],
            "owners_assigned": 2,
            "priorities_given": 2,
            "hallucinated_fields": [
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "due_date",
                "value": "next sprint"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              },
              {
                "field": "owner",
                "value": "the intern"
              },
              {
                "field": "priority",
                "value": "medium"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 9,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:09.000Z",
          "usage": {
            "input_tokens": 919,
            "output_tokens": 641,
            "total_tokens": 1560
          },
          "latencyMs": 4472,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 4,
            "item_summaries": [
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Review vendor embedding API pricing for finance",
              "Schedule Meridian renewal preparation meeting"
            ],
            "owners_assigned": 1,
            "priorities_given": 2,
            "hallucinated_fields": [
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "due_date",
                "value": "end of quarter"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 10,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:10.000Z",
          "usage": {
            "input_tokens": 950,
            "output_tokens": 749,
            "total_tokens": 1699
          },
          "latencyMs": 5902,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 3,
            "item_summaries": [
              "Build streaming CSV export for audit log before Q3 renewal",
              "Set up log viewer cleanup project",
              "Build Slack digest bot"
            ],
            "owners_assigned": 2,
            "priorities_given": 1,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Sam"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              },
              {
                "field": "due_date",
                "value": "end of quarter"
              },
              {
                "field": "due_date",
                "value": "end of quarter"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 11,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:11.000Z",
          "usage": {
            "input_tokens": 901,
            "output_tokens": 445,
            "total_tokens": 1346
          },
          "latencyMs": 4270,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 7,
            "item_summaries": [
              "Review vendor embedding API pricing for finance",
              "Assign intern to admin dark mode project",
              "Build Slack digest bot",
              "Set up log viewer cleanup project",
              "Implement search ranking rewrite with new embedding model",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Schedule Meridian renewal preparation meeting"
            ],
            "owners_assigned": 6,
            "priorities_given": 7,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "owner",
                "value": "Sam"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "owner",
                "value": "the intern"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "owner",
                "value": "the intern"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "due_date",
                "value": "next sprint"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "owner",
                "value": "Sam"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "due_date",
                "value": "next sprint"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 12,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:12.000Z",
          "usage": {
            "input_tokens": 954,
            "output_tokens": 422,
            "total_tokens": 1376
          },
          "latencyMs": 4419,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 7,
            "item_summaries": [
              "Set up log viewer cleanup project",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
              "Scope the audit log CSV export before committing to an approach",
              "Review vendor embedding API pricing for finance",
              "Schedule Meridian renewal preparation meeting",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Implement search ranking rewrite with new embedding model"
            ],
            "owners_assigned": 5,
            "priorities_given": 3,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Danny"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "owner",
                "value": "the intern"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "owner",
                "value": "Danny"
              },
              {
                "field": "priority",
                "value": "highest"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 13,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:13.000Z",
          "usage": {
            "input_tokens": 942,
            "output_tokens": 583,
            "total_tokens": 1525
          },
          "latencyMs": 7270,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 4,
            "item_summaries": [
              "Assign intern to admin dark mode project",
              "Scope the audit log CSV export before committing to an approach",
              "Review vendor embedding API pricing for finance",
              "Implement search ranking rewrite with new embedding model"
            ],
            "owners_assigned": 1,
            "priorities_given": 4,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "the intern"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "due_date",
                "value": "next sprint"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "priority",
                "value": "medium"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 14,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:14.000Z",
          "usage": {
            "input_tokens": 937,
            "output_tokens": 782,
            "total_tokens": 1719
          },
          "latencyMs": 6545,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 3,
            "item_summaries": [
              "Build streaming CSV export for audit log before Q3 renewal",
              "Schedule Meridian renewal preparation meeting",
              "Review vendor embedding API pricing for finance"
            ],
            "owners_assigned": 3,
            "priorities_given": 2,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "priority",
                "value": "high"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 15,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:15.000Z",
          "usage": {
            "input_tokens": 958,
            "output_tokens": 584,
            "total_tokens": 1542
          },
          "latencyMs": 3468,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 3,
            "item_summaries": [
              "Build Slack digest bot",
              "Assign intern to admin dark mode project",
              "Implement search ranking rewrite with new embedding model"
            ],
            "owners_assigned": 1,
            "priorities_given": 3,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Jordan"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "priority",
                "value": "high"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 16,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:16.000Z",
          "usage": {
            "input_tokens": 952,
            "output_tokens": 603,
            "total_tokens": 1555
          },
          "latencyMs": 3252,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 8,
            "item_summaries": [
              "Build Slack digest bot",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Set up log viewer cleanup project",
              "Schedule Meridian renewal preparation meeting",
              "Scope the audit log CSV export before committing to an approach",
              "Review vendor embedding API pricing for finance",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
              "Assign intern to admin dark mode project"
            ],
            "owners_assigned": 4,
            "priorities_given": 4,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "owner",
                "value": "Sam"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "owner",
                "value": "the intern"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              },
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "priority",
                "value": "highest"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 17,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:17.000Z",
          "usage": {
            "input_tokens": 934,
            "output_tokens": 672,
            "total_tokens": 1606
          },
          "latencyMs": 5465,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 5,
            "item_summaries": [
              "Assign intern to admin dark mode project",
              "Build Slack digest bot",
              "Build streaming CSV export for audit log before Q3 renewal",
              "Set up log viewer cleanup project",
              "Implement search ranking rewrite with new embedding model"
            ],
            "owners_assigned": 3,
            "priorities_given": 2,
            "hallucinated_fields": [
              {
                "field": "priority",
                "value": "high"
              },
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "due_date",
                "value": "next sprint"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 18,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:18.000Z",
          "usage": {
            "input_tokens": 916,
            "output_tokens": 407,
            "total_tokens": 1323
          },
          "latencyMs": 5979,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 4,
            "item_summaries": [
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
              "Build Slack digest bot",
              "Review vendor embedding API pricing for finance",
              "Set up log viewer cleanup project"
            ],
            "owners_assigned": 2,
            "priorities_given": 1,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "priority",
                "value": "medium"
              }
            ],
            "parse_method": "heuristic"
          }
        },
        {
          "index": 19,
          "mode": "naked",
          "startedAt": "2026-08-26T14:00:19.000Z",
          "usage": {
            "input_tokens": 949,
            "output_tokens": 359,
            "total_tokens": 1308
          },
          "latencyMs": 7155,
          "model": "claude-sonnet-5",
          "metrics": {
            "action_item_count": 3,
            "item_summaries": [
              "Implement search ranking rewrite with new embedding model",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
              "Build Slack digest bot"
            ],
            "owners_assigned": 2,
            "priorities_given": 2,
            "hallucinated_fields": [
              {
                "field": "owner",
                "value": "the intern"
              },
              {
                "field": "priority",
                "value": "highest"
              },
              {
                "field": "owner",
                "value": "Alex"
              },
              {
                "field": "priority",
                "value": "medium"
              },
              {
                "field": "due_date",
                "value": "before Q3 renewal"
              }
            ],
            "parse_method": "heuristic"
          }
        }
      ],
      "set_metrics": {
        "runs": 20,
        "item_count_min": 3,
        "item_count_max": 8,
        "item_count_mean": 5.4,
        "item_count_stddev": 1.85,
        "distinct_ticket_sets": 20,
        "total_owners_assigned": 68,
        "total_priorities_given": 68,
        "total_hallucinated_fields": 137
      },
      "total_usage": {
        "input_tokens": 18650,
        "output_tokens": 11780,
        "total_tokens": 30430,
        "total_latency_ms": 112423
      }
    },
    "shelled": {
      "runs": [
        {
          "index": 0,
          "mode": "shelled",
          "startedAt": "2026-08-26T14:05:00.000Z",
          "usage": {
            "input_tokens": 1450,
            "output_tokens": 610,
            "total_tokens": 2060
          },
          "latencyMs": 6100,
          "model": "claude-sonnet-5",
          "repaired": false,
          "metrics": {
            "action_item_count": 2,
            "item_summaries": [
              "Scope the audit log CSV export before committing to an approach",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)"
            ],
            "owners_assigned": 0,
            "priorities_given": 0,
            "hallucinated_fields": [],
            "dropped_by_evidence_gate": 0,
            "parse_method": "schema-validated"
          }
        },
        {
          "index": 1,
          "mode": "shelled",
          "startedAt": "2026-08-26T14:05:01.000Z",
          "usage": {
            "input_tokens": 1450,
            "output_tokens": 611,
            "total_tokens": 2061
          },
          "latencyMs": 6500,
          "model": "claude-sonnet-5",
          "repaired": false,
          "metrics": {
            "action_item_count": 2,
            "item_summaries": [
              "Scope the audit log CSV export before committing to an approach",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)"
            ],
            "owners_assigned": 0,
            "priorities_given": 0,
            "hallucinated_fields": [],
            "dropped_by_evidence_gate": 1,
            "parse_method": "schema-validated"
          }
        },
        {
          "index": 2,
          "mode": "shelled",
          "startedAt": "2026-08-26T14:05:02.000Z",
          "usage": {
            "input_tokens": 1450,
            "output_tokens": 612,
            "total_tokens": 2062
          },
          "latencyMs": 6900,
          "model": "claude-sonnet-5",
          "repaired": false,
          "metrics": {
            "action_item_count": 2,
            "item_summaries": [
              "Scope the audit log CSV export before committing to an approach",
              "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)"
            ],
            "owners_assigned": 0,
            "priorities_given": 0,
            "hallucinated_fields": [],
            "dropped_by_evidence_gate": 0,
            "parse_method": "schema-validated"
          }
        }
      ],
      "set_metrics": {
        "runs": 3,
        "item_count_min": 2,
        "item_count_max": 2,
        "item_count_mean": 2,
        "item_count_stddev": 0,
        "distinct_ticket_sets": 1,
        "total_owners_assigned": 0,
        "total_priorities_given": 0,
        "total_hallucinated_fields": 0
      },
      "total_usage": {
        "input_tokens": 4350,
        "output_tokens": 1833,
        "total_tokens": 6183,
        "total_latency_ms": 19500
      }
    }
  };
  var generateDoc = false;
  var polls = 0;
  var STAGE_SEQUENCE = ["queued", "extracting", "extracted", "enriching", "enriched", "creating-tickets", "writing-doc", "done"];
  function simulatedJob() {
    const stages = STAGE_SEQUENCE.filter((s) => s !== "writing-doc" || generateDoc);
    const status = stages[Math.min(polls, stages.length - 1)];
    const idx = stages.indexOf(status);
    const past = (s) => idx > stages.indexOf(s);
    return {
      status,
      meetingTitle: "Weekly platform sync (preview)",
      generateDoc,
      error: null,
      dropped: past("extracting") ? [{ summary: "Ship the Slack digest bot before Q3", evidence_quote: "We agreed the digest bot ships by Q3." }] : [],
      itemCount: past("extracting") ? 4 : null,
      created: past("enriched") ? [
        { issueKey: "MEET-101", summary: "Cache tax rates per region" },
        { issueKey: "MEET-102", summary: "Hotfix Android 13 rotation crash from the 4.1 tag" },
        { issueKey: "MEET-103", summary: "Server-side notification rate limit (config value, no UI)" }
      ] : [],
      failed: [],
      confluencePage: generateDoc && status === "done" ? { pageId: "12345", pageUrl: "#preview-only", title: "Checkout latency: plan of record \u2014 2026-08-27" } : null,
      docError: null,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  var invoke = async (name, payload) => {
    if (name === "listSessions") {
      return [{
        sessionId: comparison.session.id,
        meetingTitle: comparison.session.meetingTitle,
        createdAt: comparison.session.createdAt,
        nakedRuns: comparison.session.naked_requested,
        shelledRuns: comparison.session.shelled_requested
      }];
    }
    if (name === "getComparison") return comparison;
    if (name === "submitMeeting") {
      generateDoc = Boolean(payload && payload.generate_doc);
      polls = 0;
      return { ok: true, jobId: "job-preview-000-demo" };
    }
    if (name === "getJob") {
      polls += 1;
      return simulatedJob();
    }
    throw new Error("unknown resolver: " + name);
  };
  var router = {
    open: (url) => window.alert("Preview only \u2014 in Jira this opens " + url)
  };

  // src/gallery/main.js
  var tabNew = document.getElementById("tab-new");
  var tabDrift = document.getElementById("tab-drift");
  tabNew.addEventListener("click", () => switchTab("new"));
  tabDrift.addEventListener("click", () => switchTab("drift"));
  function switchTab(which) {
    tabNew.classList.toggle("active", which === "new");
    tabDrift.classList.toggle("active", which === "drift");
    document.getElementById("panel-new").hidden = which !== "new";
    document.getElementById("panel-drift").hidden = which !== "drift";
  }
  var STAGES = [
    { key: "queued", name: "Queued", detail: "Job accepted, waiting for a worker" },
    { key: "extracting", name: "AI 1 \u2014 Extract", detail: "Model reads the transcript for decisions and action items" },
    { key: "extracted", name: "Gate 1 \u2014 Evidence check", detail: "Code verifies every item quotes the transcript verbatim; no receipts, no ticket" },
    { key: "enriching", name: "AI 2 \u2014 Enrich + Gate 2", detail: "Org context added; the AI cannot change what already passed gate 1" },
    { key: "enriched", name: "Dedupe", detail: "Similar open tickets flagged for the reviewer, never auto-discarded" },
    { key: "creating-tickets", name: "Create Jira tickets", detail: "Tickets land in the Review column for human approval" },
    { key: "writing-doc", name: "AI 3 \u2014 Strategy doc", detail: "Synthesized Confluence page: decisions, dissent, risks, plan" },
    { key: "done", name: "Done", detail: "" }
  ];
  var form = document.getElementById("meeting-form");
  var formErr = document.getElementById("form-err");
  var pollTimer = null;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formErr.textContent = "";
    const generateDoc2 = document.getElementById("f-doc").checked;
    const payload = {
      transcript: document.getElementById("f-transcript").value.trim(),
      meeting_title: document.getElementById("f-title").value.trim(),
      attendees: document.getElementById("f-attendees").value.split(",").map((a) => a.trim()).filter(Boolean),
      loom_url: document.getElementById("f-loom").value.trim() || void 0,
      generate_doc: generateDoc2
    };
    if (!payload.transcript) delete payload.transcript;
    const submitBtn = document.getElementById("f-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting\u2026";
    try {
      const result = await invoke("submitMeeting", payload);
      if (!result.ok) {
        formErr.textContent = result.errors.join(" \xB7 ");
        return;
      }
      watchJob(result.jobId, generateDoc2);
    } catch (err) {
      formErr.textContent = `Submit failed: ${err.message || err}`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Run the pipeline";
    }
  });
  document.getElementById("f-fixture").addEventListener("click", () => {
    document.getElementById("f-title").value = "Weekly platform sync";
    document.getElementById("f-attendees").value = "Danny, Sarah, Marcus, Priya, Jake";
    document.getElementById("f-transcript").value = "Danny: Alright, we're recording. Checkout latency first. Sarah?\n\nSarah: p95 is at 4.2 seconds since the tax change shipped \u2014 it's the synchronous vendor call. If we cache the tax rates per region we fix both this and the payment worker timeouts. Two, three days.\n\nDanny: Okay, Sarah takes the tax rate caching. Priority one, in review by Friday.\n\nMarcus: Tuesday's release crashes on Android 13 when users rotate during checkout \u2014 about eight hundred sessions a day. I can repro it now. I'll hotfix off the 4.1 tag, cherry-picked, not from the release branch.\n\nPriya: And Jake can pair with me next week on the Android push registration flow \u2014 the provider migration is half done. Also, we sent four marketing pushes in one hour last Thursday and opt-outs doubled.\n\nDanny: Do the rate limit, but cap the scope: max pushes per user per day, config value, no UI. Decisions on record: tax caching P1 with Sarah, Marcus hotfixes from the 4.1 tag, Jake pairs with Priya, Priya builds the rate limit. I still think the rate limit treats a symptom \u2014 noting my dissent. Done.";
  });
  function watchJob(jobId, generateDoc2) {
    clearInterval(pollTimer);
    renderTimeline({ status: "queued", generateDoc: generateDoc2, created: [], dropped: [] }, jobId);
    pollTimer = setInterval(async () => {
      try {
        const job = await invoke("getJob", { jobId });
        if (!job) return;
        renderTimeline(job, jobId);
        if (job.status === "done" || job.status === "failed") clearInterval(pollTimer);
      } catch {
      }
    }, 2500);
  }
  function renderTimeline(job, jobId) {
    const stages = STAGES.filter((s) => s.key !== "writing-doc" || job.generateDoc);
    const currentIndex = stages.findIndex((s) => s.key === job.status);
    const failed = job.status === "failed";
    const html = stages.map((stage, i) => {
      let state = "pending";
      if (failed && i === (currentIndex === -1 ? stages.length - 1 : currentIndex)) state = "failed";
      else if (currentIndex === -1 || i < currentIndex) state = "done";
      else if (i === currentIndex) state = job.status === "done" ? "done" : "active";
      let detail = stage.detail;
      if (stage.key === "extracted" && job.dropped?.length) {
        detail += job.dropped.map(
          (d) => `<div class="gate-drop">Dropped: "${esc(d.summary)}" \u2014 its evidence quote was not in the transcript</div>`
        ).join("");
      }
      if (stage.key === "creating-tickets" && job.created?.length) {
        detail = `Created ${job.created.length} ticket(s): ` + job.created.map((t) => `<a class="ticket-link" data-key="${esc(t.issueKey)}">${esc(t.issueKey)}</a>`).join("");
      }
      if (stage.key === "writing-doc") {
        if (job.confluencePage) {
          detail = `Published: <a href="${esc(job.confluencePage.pageUrl)}" target="_blank" rel="noreferrer">${esc(job.confluencePage.title)}</a>`;
        } else if (job.docError) {
          detail = `Doc failed (tickets unaffected): ${esc(job.docError)}`;
        }
      }
      if (stage.key === "done" && job.status === "done") {
        detail = `${job.created?.length || 0} ticket(s) in Review${job.confluencePage ? ", strategy doc published" : ""}${job.dropped?.length ? `, ${job.dropped.length} item(s) rejected by the evidence gate` : ""}.`;
      }
      if (failed && state === "failed") detail = esc(job.error || "Failed \u2014 see forge logs");
      return `<div class="step ${state}"><div class="dot"></div>
        <div class="body"><div class="name">${esc(stage.name)}</div>
        <div class="detail">${detail}</div></div></div>`;
    }).join("");
    document.getElementById("timeline").innerHTML = `<h2 style="font-size:17px;margin:8px 0 4px">Pipeline run <span style="color:var(--dim);font-weight:400">${esc(jobId)}</span></h2>` + html;
    document.querySelectorAll(".ticket-link[data-key]").forEach((el) => {
      el.addEventListener("click", () => {
        try {
          router.open(`/browse/${el.dataset.key}`);
        } catch {
          window.open(`/browse/${el.dataset.key}`, "_blank");
        }
      });
    });
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  var selectedSession = null;
  async function init() {
    const sessions = await invoke("listSessions").catch(() => []);
    const container = document.getElementById("sessions");
    if (!sessions.length) {
      container.innerHTML = '<p class="pending">No drift sessions yet. Run demo/send-transcript.ps1 -Drift (or drift-run.sh) to start one.</p>';
      return;
    }
    for (const s of sessions) {
      const btn = document.createElement("button");
      btn.textContent = `${s.meetingTitle} (${new Date(s.createdAt).toLocaleString()})`;
      btn.addEventListener("click", () => select(s.sessionId, btn));
      container.appendChild(btn);
    }
  }
  async function select(sessionId, btn) {
    selectedSession = sessionId;
    document.querySelectorAll(".sessions button").forEach((b) => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    document.getElementById("status").textContent = "Loading runs\u2026";
    try {
      const comparison2 = await invoke("getComparison", { sessionId });
      document.getElementById("status").textContent = "";
      render(comparison2);
    } catch (e) {
      document.getElementById("status").textContent = `Failed to load: ${e.message || e}`;
    }
  }
  function render(data) {
    const out = document.getElementById("out");
    const pending = data.session.done ? "" : `<p class="pending">Still running: ${data.session.naked_complete}/${data.session.naked_requested} naked, ${data.session.shelled_complete}/${data.session.shelled_requested} shelled. <button class="refresh" id="refresh">Refresh</button></p>`;
    out.innerHTML = `
    ${pending}
    <div class="cols">
      ${renderSet("naked", "Naked \u2014 one generic prompt, no rules", data.naked)}
      ${renderSet("shelled", "Shelled \u2014 schema gate + evidence check", data.shelled)}
    </div>`;
    const refresh = document.getElementById("refresh");
    if (refresh) refresh.addEventListener("click", () => select(selectedSession));
  }
  function renderSet(kind, title, set) {
    const m = set.set_metrics;
    if (!m) return `<div class="set ${kind}"><h2>${title}</h2><p class="pending">No completed runs yet.</p></div>`;
    const u = set.total_usage;
    const verdict = kind === "naked" ? `${m.runs} identical requests \u2192 ${m.distinct_ticket_sets} different ticket sets, ${m.total_hallucinated_fields} hallucinated fields` : m.distinct_ticket_sets === 1 ? `${m.runs} runs \u2192 1 ticket set. Converged. Zero hallucinated fields survived the gate.` : `${m.runs} runs \u2192 ${m.distinct_ticket_sets} ticket sets, 0 hallucinated fields survived the gate`;
    return `
    <div class="set ${kind}">
      <h2>${escapeHtml(title)}</h2>
      <div class="bignums">
        <div class="bignum hot"><div class="v">${m.distinct_ticket_sets}</div><div class="l">distinct ticket sets</div></div>
        <div class="bignum"><div class="v">${m.item_count_min}\u2013${m.item_count_max}</div><div class="l">tickets per run</div></div>
        <div class="bignum"><div class="v">\u03C3 ${m.item_count_stddev}</div><div class="l">std deviation</div></div>
        <div class="bignum hot"><div class="v">${m.total_hallucinated_fields}</div><div class="l">hallucinated fields</div></div>
        <div class="bignum"><div class="v">${m.total_owners_assigned}</div><div class="l">owners assigned</div></div>
      </div>
      ${scatter(kind, set.runs)}
      <div class="runs">${set.runs.map(runCard).join("")}</div>
      <div class="verdict">${escapeHtml(verdict)}</div>
      <p class="sub" style="margin-top:10px">${(u.total_tokens || 0).toLocaleString()} tokens \xB7 ${((u.total_latency_ms || 0) / 1e3).toFixed(1)}s model time across ${m.runs} runs</p>
    </div>`;
  }
  function scatter(kind, runs) {
    const W = 560, H = 260, PAD = 36;
    const counts = runs.map((r) => r.metrics ? r.metrics.action_item_count : 0);
    const maxY = Math.max(6, ...counts) + 1;
    const color = kind === "naked" ? "var(--naked)" : "var(--shelled)";
    const dots = runs.map((r, i) => {
      const n = r.metrics ? r.metrics.action_item_count : 0;
      const x = PAD + (i + 0.5) * ((W - PAD * 2) / Math.max(runs.length, 1));
      const y = H - PAD - n / maxY * (H - PAD * 2);
      const hall = r.metrics && r.metrics.hallucinated_fields ? r.metrics.hallucinated_fields.length : 0;
      return `<circle cx="${x}" cy="${y}" r="${7 + hall * 2}" fill="${color}" fill-opacity="0.75">
        <title>Run ${r.index + 1}: ${n} tickets${hall ? ", " + hall + " hallucinated fields" : ""}</title></circle>`;
    }).join("");
    const gridlines = [];
    for (let g = 0; g <= maxY; g += Math.ceil(maxY / 6)) {
      const y = H - PAD - g / maxY * (H - PAD * 2);
      gridlines.push(`<line x1="${PAD}" x2="${W - PAD}" y1="${y}" y2="${y}" stroke="var(--border)" stroke-dasharray="3 5"/>
      <text x="${PAD - 8}" y="${y + 4}" fill="var(--dim)" font-size="11" text-anchor="end">${g}</text>`);
    }
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    ${gridlines.join("")}${dots}
    <text x="${W / 2}" y="${H - 8}" fill="var(--dim)" font-size="11" text-anchor="middle">runs \u2192 (dot size grows with hallucinated fields)</text>
  </svg>`;
  }
  function runCard(r) {
    const m = r.metrics;
    const hall = m && m.hallucinated_fields ? m.hallucinated_fields.length : 0;
    const dropped = m && typeof m.dropped_by_evidence_gate === "number" ? m.dropped_by_evidence_gate : 0;
    return `<div class="run">
    <div class="hd"><span>Run ${r.index + 1}</span>
      <span>${r.error ? '<span class="badge hall">error</span>' : ""}
        ${hall ? `<span class="badge hall">${hall} hallucinated</span>` : ""}
        ${dropped ? `<span class="badge drop">${dropped} dropped by gate</span>` : ""}</span></div>
    ${r.error ? `<p>${escapeHtml(r.error)}</p>` : `<ul>${(m && m.item_summaries || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`}
  </div>`;
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  init();
})();
