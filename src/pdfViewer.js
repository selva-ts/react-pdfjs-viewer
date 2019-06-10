/* eslint-disable default-case */
import 'pdfjs-dist/web/pdf_viewer.css';
import {
	EventBus,
	PDFViewer,
} from 'pdfjs-dist/web/pdf_viewer';
import React, { Component } from 'react';

import pdfjsLib from 'pdfjs-dist/webpack';
import PropTypes from 'prop-types';

const DEFAULT_SCALE_DELTA = 1.1;
const MAX_SCALE = 10;
const MIN_SCALE = 0.10;

class ORGPdfViewer extends Component {
	constructor(props) {
		super(props);

		this.initEventBus();
		this.state = {
			docToRender: null,
			pageNumber: 1,
			scale: 'page-actual',
			totalPages: 0,
		};
	}

	componentDidMount() {
		this.isMounted = true;
		this.viewerContainerNode.addEventListener('keydown', this.onViewerKeyPress);

		const {
			documentUrl,
		} = this.props;

		const loadingTask = pdfjsLib.getDocument(documentUrl);

		loadingTask.promise.then((docToRender) => {
			if (this.isMounted) {
				this.setState({
					docToRender,
				});
			}
		}, () => {});

		this.pdfViewer = new PDFViewer({
			container: this.viewerContainerNode,
			eventBus: this.eventBus,
			viewer: this.viewerNode,
		});
	}

	shouldComponentUpdate(_nextProps, nextState) {
		const {
			docToRender,
			pageNumber,
			scale,
			totalPages,
		} = this.state;

		return (
			docToRender !== nextState.docToRender
			|| scale !== nextState.scale
			|| pageNumber !== nextState.pageNumber
			|| totalPages !== nextState.totalPages
		);
	}

	componentDidUpdate(_prevProps, prevState) {
		const {
			docToRender,
			scale,
		} = this.state;
		if (docToRender !== prevState.docToRender) {
			this.pdfViewer.setDocument(docToRender);
		}
		if (scale !== prevState.scale) {
			this.pdfViewer.currentScaleValue = scale;
		}
	}

	componentWillUnmount() {
		this.isMounted = false;
		this.viewerContainerNode.removeEventListener('keydown', this.onViewerKeyPress);
	}

	onPageNumberChange = (event) => {
		const pageNumber = event.target.value;
		if (pageNumber === '' || isWholeNumber(pageNumber)) {
			this.setState({
				pageNumber,
			});
		}
	}

	onPageNumberKeyPress = (event) => {
		if (event.keyCode === KEY_CODE_ENTER) {
			let {
				pageNumber,
			} = this.state;

			pageNumber = Number(pageNumber);
			const currentPage = this.pdfViewer.currentPageNumber;
			const totalPages = this.pdfViewer.pagesCount;

			if (pageNumber && pageNumber <= totalPages) {
				if (pageNumber >= 1 && pageNumber !== currentPage) {
					this.pdfViewer.currentPageNumber = pageNumber;
				}
			} else {
				this.setState({
					pageNumber: currentPage,
				});
			}
		}
	}

	onViewerKeyPress = (e) => {
		const currentPage = this.pdfViewer.currentPageNumber;
		const totalPages = this.pdfViewer.pagesCount;

		switch (e.keyCode) {
			// Move to first page
		// 	case KEY_CODE_HOME:
		// 		if (currentPage !== 1) {
		// 			this.pdfViewer.currentPageNumber = 1;
		// 		}
		// 		break;

		// 	// Move to last page
		// 	case KEY_CODE_END:
		// 		if (currentPage !== totalPages) {
		// 			this.pdfViewer.currentPageNumber = totalPages;
		// 		}
		// 		break;

		// 	// Move to next page
		// 	case KEY_CODE_PAGE_DOWN:
		// 	case KEY_CODE_ARROW_RIGHT:
		// 		if (currentPage < totalPages) {
		// 			this.pdfViewer.currentPageNumber += 1;
		// 		}
		// 		break;

		// 	// Move to previous page
		// 	case KEY_CODE_PAGE_UP:
		// 	case KEY_CODE_ARROW_LEFT:
		// 		if (currentPage > 1) {
		// 			this.pdfViewer.currentPageNumber -= 1;
		// 		}
		// 		break;

		// 	default:
		}
	}

    webViewerKeyDown(evt) {
        if (PDFViewerApplication.overlayManager.active) {
          return;
        }
      
        let handled = false, ensureViewerFocused = false;
        let cmd = (evt.ctrlKey ? 1 : 0) |
                  (evt.altKey ? 2 : 0) |
                  (evt.shiftKey ? 4 : 0) |
                  (evt.metaKey ? 8 : 0);
      
        let pdfViewer = PDFViewerApplication.pdfViewer;
        let isViewerInPresentationMode = pdfViewer && pdfViewer.isInPresentationMode;
      
        // First, handle the key bindings that are independent whether an input
        // control is selected or not.
        if (cmd === 1 || cmd === 8 || cmd === 5 || cmd === 12) {
          // either CTRL or META key with optional SHIFT.
          switch (evt.keyCode) {
            case 70: // f
              if (!PDFViewerApplication.supportsIntegratedFind) {
                PDFViewerApplication.findBar.open();
                handled = true;
              }
              break;
            case 71: // g
              if (!PDFViewerApplication.supportsIntegratedFind) {
                let findState = PDFViewerApplication.findController.state;
                if (findState) {
                  PDFViewerApplication.findController.executeCommand('findagain', {
                    query: findState.query,
                    phraseSearch: findState.phraseSearch,
                    caseSensitive: findState.caseSensitive,
                    entireWord: findState.entireWord,
                    highlightAll: findState.highlightAll,
                    findPrevious: cmd === 5 || cmd === 12,
                  });
                }
                handled = true;
              }
              break;
            case 61: // FF/Mac '='
            case 107: // FF '+' and '='
            case 187: // Chrome '+'
            case 171: // FF with German keyboard
              if (!isViewerInPresentationMode) {
                PDFViewerApplication.zoomIn();
              }
              handled = true;
              break;
            case 173: // FF/Mac '-'
            case 109: // FF '-'
            case 189: // Chrome '-'
              if (!isViewerInPresentationMode) {
                PDFViewerApplication.zoomOut();
              }
              handled = true;
              break;
            case 48: // '0'
            case 96: // '0' on Numpad of Swedish keyboard
              if (!isViewerInPresentationMode) {
                // keeping it unhandled (to restore page zoom to 100%)
                setTimeout(function() {
                  // ... and resetting the scale after browser adjusts its scale
                  PDFViewerApplication.zoomReset();
                });
                handled = false;
              }
              break;
      
            case 38: // up arrow
              if (isViewerInPresentationMode || PDFViewerApplication.page > 1) {
                PDFViewerApplication.page = 1;
                handled = true;
                ensureViewerFocused = true;
              }
              break;
            case 40: // down arrow
              if (isViewerInPresentationMode ||
                  PDFViewerApplication.page < PDFViewerApplication.pagesCount) {
                PDFViewerApplication.page = PDFViewerApplication.pagesCount;
                handled = true;
                ensureViewerFocused = true;
              }
              break;
          }
        }
      
        if (typeof PDFJSDev === 'undefined' ||
            !PDFJSDev.test('FIREFOX || MOZCENTRAL')) {
          // CTRL or META without shift
          if (cmd === 1 || cmd === 8) {
            switch (evt.keyCode) {
              case 83: // s
                PDFViewerApplication.download();
                handled = true;
                break;
            }
          }
        }
      
        // CTRL+ALT or Option+Command
        if (cmd === 3 || cmd === 10) {
          switch (evt.keyCode) {
            case 80: // p
              PDFViewerApplication.requestPresentationMode();
              handled = true;
              break;
            case 71: // g
              // focuses input#pageNumber field
              PDFViewerApplication.appConfig.toolbar.pageNumber.select();
              handled = true;
              break;
          }
        }
      
        if (handled) {
          if (ensureViewerFocused && !isViewerInPresentationMode) {
            pdfViewer.focus();
          }
          evt.preventDefault();
          return;
        }
      
        // Some shortcuts should not get handled if a control/input element
        // is selected.
        let curElement = document.activeElement || document.querySelector(':focus');
        let curElementTagName = curElement && curElement.tagName.toUpperCase();
        if (curElementTagName === 'INPUT' ||
            curElementTagName === 'TEXTAREA' ||
            curElementTagName === 'SELECT') {
          // Make sure that the secondary toolbar is closed when Escape is pressed.
          if (evt.keyCode !== 27) { // 'Esc'
            return;
          }
        }
      
        if (cmd === 0) { // no control key pressed at all.
          let turnPage = 0, turnOnlyIfPageFit = false;
          switch (evt.keyCode) {
            case 38: // up arrow
            case 33: // pg up
              // vertical scrolling using arrow/pg keys
              if (pdfViewer.isVerticalScrollbarEnabled) {
                turnOnlyIfPageFit = true;
              }
              turnPage = -1;
              break;
            case 8: // backspace
              if (!isViewerInPresentationMode) {
                turnOnlyIfPageFit = true;
              }
              turnPage = -1;
              break;
            case 37: // left arrow
              // horizontal scrolling using arrow keys
              if (pdfViewer.isHorizontalScrollbarEnabled) {
                turnOnlyIfPageFit = true;
              }
              /* falls through */
            case 75: // 'k'
            case 80: // 'p'
              turnPage = -1;
              break;
            case 27: // esc key
              if (PDFViewerApplication.secondaryToolbar.isOpen) {
                PDFViewerApplication.secondaryToolbar.close();
                handled = true;
              }
              if (!PDFViewerApplication.supportsIntegratedFind &&
                  PDFViewerApplication.findBar.opened) {
                PDFViewerApplication.findBar.close();
                handled = true;
              }
              break;
            case 40: // down arrow
            case 34: // pg down
              // vertical scrolling using arrow/pg keys
              if (pdfViewer.isVerticalScrollbarEnabled) {
                turnOnlyIfPageFit = true;
              }
              turnPage = 1;
              break;
            case 13: // enter key
            case 32: // spacebar
              if (!isViewerInPresentationMode) {
                turnOnlyIfPageFit = true;
              }
              turnPage = 1;
              break;
            case 39: // right arrow
              // horizontal scrolling using arrow keys
              if (pdfViewer.isHorizontalScrollbarEnabled) {
                turnOnlyIfPageFit = true;
              }
              /* falls through */
            case 74: // 'j'
            case 78: // 'n'
              turnPage = 1;
              break;
      
            case 36: // home
              if (isViewerInPresentationMode || PDFViewerApplication.page > 1) {
                PDFViewerApplication.page = 1;
                handled = true;
                ensureViewerFocused = true;
              }
              break;
            case 35: // end
              if (isViewerInPresentationMode ||
                  PDFViewerApplication.page < PDFViewerApplication.pagesCount) {
                PDFViewerApplication.page = PDFViewerApplication.pagesCount;
                handled = true;
                ensureViewerFocused = true;
              }
              break;
      
            case 83: // 's'
              PDFViewerApplication.pdfCursorTools.switchTool(CursorTool.SELECT);
              break;
            case 72: // 'h'
              PDFViewerApplication.pdfCursorTools.switchTool(CursorTool.HAND);
              break;
      
            case 82: // 'r'
              PDFViewerApplication.rotatePages(90);
              break;
      
            case 115: // F4
              PDFViewerApplication.pdfSidebar.toggle();
              break;
          }
      
          if (turnPage !== 0 &&
              (!turnOnlyIfPageFit || pdfViewer.currentScaleValue === 'page-fit')) {
            if (turnPage > 0) {
              if (PDFViewerApplication.page < PDFViewerApplication.pagesCount) {
                PDFViewerApplication.page++;
              }
            } else {
              if (PDFViewerApplication.page > 1) {
                PDFViewerApplication.page--;
              }
            }
            handled = true;
          }
        }
      
        if (cmd === 4) { // shift-key
          switch (evt.keyCode) {
            case 13: // enter key
            case 32: // spacebar
              if (!isViewerInPresentationMode &&
                  pdfViewer.currentScaleValue !== 'page-fit') {
                break;
              }
              if (PDFViewerApplication.page > 1) {
                PDFViewerApplication.page--;
              }
              handled = true;
              break;
      
            case 82: // 'r'
              PDFViewerApplication.rotatePages(-90);
              break;
          }
        }
      
        if (!handled && !isViewerInPresentationMode) {
          // 33=Page Up  34=Page Down  35=End    36=Home
          // 37=Left     38=Up         39=Right  40=Down
          // 32=Spacebar
          if ((evt.keyCode >= 33 && evt.keyCode <= 40) ||
              (evt.keyCode === 32 && curElementTagName !== 'BUTTON')) {
            ensureViewerFocused = true;
          }
        }
      
        if (ensureViewerFocused && !pdfViewer.containsElement(curElement)) {
          // The page container is not focused, but a page navigation key has been
          // pressed. Change the focus to the viewer container to make sure that
          // navigation by keyboard works as expected.
          pdfViewer.focus();
        }
      
        if (handled) {
          evt.preventDefault();
        }
      }
      
	getScaleLabelValue = scale => (
		PDF_VIEWER_ZOOM_SCALE_SOURCE
			.find(x => x.shortcode === scale) ? scale : `${Math.round(scale * 10000) / 100}%`
	);

	initEventBus() {
		const eventBus = new EventBus();

		eventBus.on('pagechange', (e) => {
			if (e.pageNumber !== e.previousPageNumber) {
				this.setState({
					pageNumber: e.pageNumber,
				});
			}
		});

		eventBus.on('pagesloaded', (e) => {
			this.setState({
				totalPages: e.pagesCount,
			});
		});

		this.eventBus = eventBus;
	}

	scaleChange(target) {
		this.setState({
			scale: target.value,
		});
	}

	zoomIn() {
		let newScale = (this.pdfViewer.currentScale * DEFAULT_SCALE_DELTA).toFixed(2);
		newScale = Math.ceil(newScale * 10) / 10;
		newScale = Math.min(MAX_SCALE, newScale);

		this.pdfViewer.currentScaleValue = newScale;
		this.setState({
			scale: this.pdfViewer.currentScaleValue,
		});
	}

	zoomOut() {
		let newScale = (this.pdfViewer.currentScale / DEFAULT_SCALE_DELTA).toFixed(2);
		newScale = Math.floor(newScale * 10) / 10;
		newScale = Math.max(MIN_SCALE, newScale);
		this.pdfViewer.currentScaleValue = newScale;
		this.setState({
			scale: this.pdfViewer.currentScaleValue,
		});
	}
	
	render() {
		const {
			classes,
			fileName,
			issueNumber,
			nextIssue,
			onDownloadClick,
			onIssueChange,
			previousIssue,
		} = this.props;

		const {
			pageNumber,
			scale,
			totalPages,
		} = this.state;

		return (
			<React.Fragment>
				<div className={classes.toolbarRoot}>
					<div className={classes.toolbar}>
						<div className={classes.toolbarItemText}>
							<ATOKeyValue
								keyText="Filename"
								valueText={this.shortenText(fileName, 100)}
							/>
						</div>
						<div className={classes.zoomToolbar}>
							<div className={classes.toolbarItemLeftIcon}>
								{this.renderInlineButton({
									icon: ATOIcon.icons.ZoomIn,
									onClick: e => this.zoomIn(e),
								})}
							</div>
							<div className={classes.toolbarItemText}>
								<MOLDropdown
									className={classes.dropdown}
									isTopLabelHidden
									label={this.getScaleLabelValue(scale)}
									name="zoomList"
									onChange={(event) => {
										this.scaleChange(event.target);
									}}
									source={PDF_VIEWER_ZOOM_SCALE_SOURCE}
									value={scale}
								/>
							</div>
							<div className={classes.toolbarItemIcon}>
								{this.renderInlineButton({
									icon: ATOIcon.icons.ZoomOut,
									onClick: e => this.zoomOut(e),
								})}
							</div>
						</div>
						<div className={classes.pagingToolbarRoot}>
							<ATOKeyValue
								keyText="page"
								valueText={(
									<SUBPdfViewerPaging
										onChange={this.onPageNumberChange}
										onKeyPress={this.onPageNumberKeyPress}
										pageNumber={pageNumber}
										totalPages={totalPages}
									/>
								)}
							/>
						</div>
					</div>
				</div>
					<div
						className="pdfViewer"
						ref={(ref) => { this.viewerNode = ref; }}
					/>
			</React.Fragment>
		);
	}
}

export default ORGPdfViewer;
