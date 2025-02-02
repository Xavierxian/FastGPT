import {
  Flex,
  Box,
  Grid,
  ModalBody,
  InputGroup,
  InputLeftElement,
  Input,
  Checkbox,
  ModalFooter,
  Button,
  useToast
} from '@chakra-ui/react';
import MyModal from '@fastgpt/web/components/common/MyModal';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useContextSelector } from 'use-context-selector';
import MyAvatar from '@/components/Avatar';
import { useMemo, useState } from 'react';
import PermissionSelect from './PermissionSelect';
import PermissionTags from './PermissionTags';
import { CollaboratorContext } from './context';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/web/support/user/useUserStore';
import { getTeamMembers } from '@/web/support/user/team/api';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { Permission } from '@fastgpt/global/support/permission/controller';
import { ChevronDownIcon } from '@chakra-ui/icons';
import Avatar from '@/components/Avatar';
import { useRequest } from '@fastgpt/web/hooks/useRequest';

export type AddModalPropsType = {
  onClose: () => void;
};

export function AddMemberModal({ onClose }: AddModalPropsType) {
  const toast = useToast();
  const { userInfo } = useUserStore();

  const { permissionList, collaboratorList, onUpdateCollaborators, getPreLabelList } =
    useContextSelector(CollaboratorContext, (v) => v);
  const [searchText, setSearchText] = useState<string>('');
  const {
    data: members = [],
    refetch: refetchMembers,
    isLoading: loadingMembers
  } = useQuery(['getMembers', userInfo?.team?.teamId], async () => {
    if (!userInfo?.team?.teamId) return [];
    const members = await getTeamMembers();
    return members;
  });
  const filterMembers = useMemo(() => {
    return members.filter((item) => {
      if (item.permission.isOwner) return false;
      if (item.tmbId === userInfo?.team?.tmbId) return false;
      if (!searchText) return true;
      return item.memberName.includes(searchText);
    });
  }, [members, searchText, userInfo?.team?.tmbId]);

  const [selectedMemberIdList, setSelectedMembers] = useState<string[]>([]);
  const [selectedPermission, setSelectedPermission] = useState(permissionList['read'].value);
  const perLabel = useMemo(() => {
    return getPreLabelList(selectedPermission).join('、');
  }, [getPreLabelList, selectedPermission]);

  const { mutate: onConfirm, isLoading: isUpdating } = useRequest({
    mutationFn: () => {
      return onUpdateCollaborators(selectedMemberIdList, selectedPermission);
    },
    successToast: '添加成功',
    errorToast: 'Error',
    onSuccess() {
      onClose();
    }
  });

  return (
    <MyModal isOpen onClose={onClose} iconSrc="modal/AddClb" title="添加协作者" minW="800px">
      <ModalBody>
        <MyBox
          isLoading={loadingMembers}
          display={'grid'}
          minH="400px"
          border="1px solid"
          borderColor="myGray.200"
          borderRadius="0.5rem"
          gridTemplateColumns="55% 45%"
        >
          <Flex
            flexDirection="column"
            borderRight="1px solid"
            borderColor="myGray.200"
            p="4"
            minH="200px"
          >
            <InputGroup alignItems="center" h="32px" my="2" py="1">
              <InputLeftElement>
                <MyIcon name="common/searchLight" w="16px" color={'myGray.500'} />
              </InputLeftElement>
              <Input
                placeholder="搜索用户名"
                fontSize="lg"
                bgColor="myGray.50"
                onChange={(e) => setSearchText(e.target.value)}
              />
            </InputGroup>
            <Flex flexDirection="column" mt="2">
              {filterMembers.map((member) => {
                const onChange = () => {
                  if (selectedMemberIdList.includes(member.tmbId)) {
                    setSelectedMembers(selectedMemberIdList.filter((v) => v !== member.tmbId));
                  } else {
                    setSelectedMembers([...selectedMemberIdList, member.tmbId]);
                  }
                };
                const collaborator = collaboratorList.find((v) => v.tmbId === member.tmbId);
                return (
                  <Flex
                    key={member.tmbId}
                    mt="1"
                    py="1"
                    px="3"
                    borderRadius="sm"
                    alignItems="center"
                    _hover={{
                      bgColor: 'myGray.50',
                      cursor: 'pointer'
                    }}
                  >
                    <Checkbox
                      size="lg"
                      mr="3"
                      isChecked={selectedMemberIdList.includes(member.tmbId)}
                      onChange={onChange}
                    />
                    <Flex
                      flexDirection="row"
                      onClick={onChange}
                      w="full"
                      justifyContent="space-between"
                    >
                      <Flex flexDirection="row" alignItems="center">
                        <MyAvatar src={member.avatar} w="32px" />
                        <Box ml="2">{member.memberName}</Box>
                      </Flex>
                      {!!collaborator && <PermissionTags permission={collaborator.permission} />}
                    </Flex>
                  </Flex>
                );
              })}
            </Flex>
          </Flex>
          <Flex p="4" flexDirection="column">
            <Box>已选: {selectedMemberIdList.length}</Box>
            <Flex flexDirection="column" mt="2">
              {selectedMemberIdList.map((tmbId) => {
                const member = filterMembers.find((v) => v.tmbId === tmbId);
                return member ? (
                  <Flex
                    key={tmbId}
                    alignItems="center"
                    justifyContent="space-between"
                    py="2"
                    px={3}
                    borderRadius={'md'}
                    _hover={{ bg: 'myGray.50' }}
                    _notLast={{ mb: 2 }}
                  >
                    <Avatar src={member.avatar} w="24px" />
                    <Box w="full" fontSize="lg">
                      {member.memberName}
                    </Box>
                    <MyIcon
                      name="common/closeLight"
                      w="16px"
                      cursor={'pointer'}
                      _hover={{
                        color: 'red.600'
                      }}
                      onClick={() =>
                        setSelectedMembers(selectedMemberIdList.filter((v) => v !== tmbId))
                      }
                    />
                  </Flex>
                ) : null;
              })}
            </Flex>
          </Flex>
        </MyBox>
      </ModalBody>
      <ModalFooter>
        <PermissionSelect
          value={selectedPermission}
          Button={
            <Flex
              alignItems={'center'}
              bg={'myGray.50'}
              border="base"
              fontSize={'sm'}
              px={3}
              borderRadius={'md'}
              h={'32px'}
            >
              {perLabel}
              <ChevronDownIcon fontSize={'lg'} />
            </Flex>
          }
          onChange={(v) => setSelectedPermission(v)}
        />
        <Button isLoading={isUpdating} ml="4" h={'32px'} onClick={onConfirm}>
          确认
        </Button>
      </ModalFooter>
    </MyModal>
  );
}
