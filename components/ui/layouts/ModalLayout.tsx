import {
	type FC,
	type ReactElement,
	useCallback,
	useEffect,
	useState,
} from "react";
import { Keyboard, type ViewStyle } from "react-native";

import { useKeyboard } from "@/hooks/useKeyboard";

import { ModalWrapper } from "./ModalWrapper";

export interface IModalParams {
	element: ReactElement | null;
	justifyContent: ViewStyle["justifyContent"];
	marginHorizontal?: number;
	marginVertical?: number;
}

let setupModalRef: ((modalData: IModalParams) => void) | undefined;
let closeModalRef: (() => void) | undefined;

export const modal = () => {
	return {
		closeModal: closeModalRef,
		setupModal: setupModalRef,
	};
};

export const ModalLayout: FC = () => {
	const { keyboardShown } = useKeyboard();
	const [modalVisible, setModalVisible] = useState(false);
	const [_modalVisible, _setModalVisible] = useState(false);

	const [modalState, setModal] = useState<IModalParams>({
		element: null,
		justifyContent: "flex-end",
	});

	setupModalRef = useCallback((modalData: IModalParams) => {
		Keyboard.dismiss();

		setModal(modalData);
		setModalVisible(true);
	}, []);

	const closeModal = useCallback(() => {
		Keyboard.dismiss();

		setModalVisible(false);
		_setModalVisible(false);
	}, []);

	closeModalRef = closeModal;

	useEffect(() => {
		// TODO check interactions
		if (!keyboardShown && modalVisible && !_modalVisible) {
			setTimeout(() => {
				_setModalVisible(true);
			}, 200);
		}
	}, [keyboardShown, modalVisible, _modalVisible]);

	return (
		<ModalWrapper
			closeModal={closeModal}
			visible={_modalVisible}
			justifyContent={modalState.justifyContent}
			marginHorizontal={modalState.marginHorizontal}
			marginVertical={modalState.marginVertical}
		>
			{modalState.element}
		</ModalWrapper>
	);
};
